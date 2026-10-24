import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { badRequest, readJson } from "@/lib/http";
import {
  buildResetUrl,
  generateResetToken,
  hashResetToken,
  resetThrottleCutoff,
  resetTokenExpiry,
} from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

// Same reply whether or not the account exists, so this endpoint cannot be used
// to discover which emails are registered.
const GENERIC_REPLY = {
  message: "If that email is registered, a reset link has been sent.",
};

export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return badRequest("Request body must be valid JSON");

  const validated = forgotPasswordSchema.safeParse(parsed.body);
  if (!validated.success) {
    return badRequest(validated.error.issues[0]?.message ?? "Invalid input");
  }

  const user = await prisma.user.findUnique({
    where: { email: validated.data.email },
    select: { id: true, email: true },
  });

  // ponytail: two simultaneous requests can both pass this check (worst case two
  // emails). Per-IP rate limiting with a proper store is M6.
  const recentlySent =
    user &&
    (await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gt: resetThrottleCutoff() } },
    })) > 0;

  // Throttled requests get the same reply, so the throttle reveals nothing either.
  if (user && !recentlySent) {
    const token = generateResetToken();
    await prisma.$transaction([
      // A new request supersedes any older unused link.
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashResetToken(token), expiresAt: resetTokenExpiry() },
      }),
    ]);
    await sendPasswordResetEmail(user.email, buildResetUrl(token));
  }

  return NextResponse.json(GENERIC_REPLY);
}
