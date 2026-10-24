import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { badRequest, readJson } from "@/lib/http";
import { hashResetToken } from "@/lib/password-reset";

const INVALID_LINK = "This reset link is invalid or has expired";

export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return badRequest("Request body must be valid JSON");

  const validated = resetPasswordSchema.safeParse(parsed.body);
  if (!validated.success) {
    return badRequest(validated.error.issues[0]?.message ?? "Invalid input");
  }

  const { token, password } = validated.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  // Single use, enforced in the database: only one request can flip usedAt from
  // null, so two concurrent submissions of the same link cannot both succeed.
  const claimed = await prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      select: { id: true, userId: true },
    });
    if (!record) return false;

    const { count } = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (count !== 1) return false;

    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    // Any other outstanding links for this user die with the password change.
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null },
    });
    return true;
  });

  if (!claimed) return badRequest(INVALID_LINK);

  return NextResponse.json({ message: "Password updated. You can now sign in." });
}
