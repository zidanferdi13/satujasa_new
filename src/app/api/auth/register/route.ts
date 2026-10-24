import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { MemberRole, Package } from "@prisma/client";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      const message = validated.error.issues?.[0]?.message || "Invalid input";
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    const { name, email, password, organizationName } = validated.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
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
                  slug: organizationName.toLowerCase().replace(/\s+/g, "-"),
                  package: Package.BASIC,
                  operatorLimit: 1,
                  subscriptions: {
                    create: {
                      package: Package.BASIC,
                      operatorLimit: 1,
                      status: "ACTIVE",
                      currentPeriodStart: new Date(),
                      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    },
                  },
                },
              },
            },
          },
        },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      return user;
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: result.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
