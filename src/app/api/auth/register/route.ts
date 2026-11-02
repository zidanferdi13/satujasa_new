import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { MemberRole, Prisma } from "@prisma/client";
import { registerSchema } from "@/lib/validations";
import { nextAvailableSlug, slugify } from "@/lib/slug";

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: Request) {
  // BUG-05: malformed JSON is a client error, not a server error.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const validated = registerSchema.safeParse(body);
  if (!validated.success) {
    return badRequest(validated.error.issues[0]?.message ?? "Invalid input");
  }

  const { name, email, password, organizationName } = validated.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return badRequest("User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const baseSlug = slugify(organizationName);

  // BUG-02: duplicate company names are allowed; the slug gets a numeric suffix.
  // The unique constraint on Organization.slug is still the final guard, so a
  // concurrent registration that steals the slug is retried below.
  const taken = await prisma.organization.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true },
  });
  let slug = nextAvailableSlug(baseSlug, taken.map((org) => org.slug));

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const user = await prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            email,
            passwordHash,
            name,
            memberships: {
              create: {
                role: MemberRole.OWNER,
                organization: {
                  create: {
                    name: organizationName,
                    slug,
                    // BUG-15/A12: no Subscription and no seats until a PAID payment exists.
                    // operatorLimit is written explicitly because the schema default is 1.
                    operatorLimit: 0,
                  },
                },
              },
            },
          },
          include: { memberships: { include: { organization: true } } },
        });
      });

      const organization = user.memberships[0]?.organization;

      return NextResponse.json(
        {
          message: "Account created successfully",
          userId: user.id,
          organization: organization ? { id: organization.id, slug: organization.slug } : null,
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = String(error.meta?.target ?? "");
        if (target.includes("email")) {
          return badRequest("User with this email already exists");
        }
        if (target.includes("slug")) {
          // Someone else took the slug between the read and the write.
          slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
          continue;
        }
      }
      console.error("Registration error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Could not allocate an organization slug, please retry" },
    { status: 500 }
  );
}
