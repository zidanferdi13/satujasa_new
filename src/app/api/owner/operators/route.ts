import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { MemberRole, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOperatorSchema } from "@/lib/validations";
import { badRequest, readJson } from "@/lib/http";
import { canAddOperator } from "@/lib/operator-quota";
import { countSeatsUsed } from "@/lib/seats";

class OperatorLimitReached extends Error {}

/**
 * Owner creates an operator login (M1 minimal). The organization comes from the
 * signed session, never from the request body, so an owner can only add staff
 * to their own organization.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return badRequest("Not signed in", 401);
  if (session.user.role !== MemberRole.OWNER || !session.user.organizationId) {
    return badRequest("Only an organization owner can add operators", 403);
  }
  const organizationId = session.user.organizationId;

  const parsed = await readJson(request);
  if (!parsed.ok) return badRequest("Request body must be valid JSON");

  const validated = createOperatorSchema.safeParse(parsed.body);
  if (!validated.success) {
    return badRequest(validated.error.issues[0]?.message ?? "Invalid input");
  }
  const { name, email, password } = validated.data;

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const operator = await prisma.$transaction(async (tx) => {
      // Row lock on the organization serialises concurrent creates, so two
      // requests cannot both pass the limit check and overshoot operatorLimit.
      const [organization] = await tx.$queryRaw<{ operatorLimit: number }[]>`
        SELECT "operatorLimit" FROM "Organization" WHERE id = ${organizationId} FOR UPDATE`;
      if (!organization) throw new Error("Organization not found");

      const current = await countSeatsUsed(tx, organizationId);
      if (!canAddOperator(current, organization.operatorLimit)) {
        throw new OperatorLimitReached();
      }

      const user = await tx.user.create({ data: { name, email, passwordHash } });
      const member = await tx.member.create({
        data: { userId: user.id, organizationId, role: MemberRole.OPERATOR },
      });
      return tx.operator.create({
        data: { organizationId, memberId: member.id, name, email },
        select: { id: true, name: true, email: true, createdAt: true },
      });
    });

    return NextResponse.json({ operator }, { status: 201 });
  } catch (error) {
    if (error instanceof OperatorLimitReached) {
      return badRequest("Operator limit reached for your package", 403);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return badRequest("User with this email already exists", 409);
    }
    console.error("Create operator error:", error);
    return badRequest("Internal server error", 500);
  }
}
