import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashResetToken, isResetTokenUsable } from "@/lib/password-reset";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ResetPasswordForm from "./reset-password-form";

/** The token arrives in the URL, so this page renders per request, never prerendered. */
export const instant = false;

/**
 * Checks the link before showing the form (BUG-10). A link that is missing, unknown,
 * expired or already used gets an explanation and a way to get a new one — never a form
 * that cannot succeed.
 */
async function isTokenUsable(token: string): Promise<boolean> {
  if (!token) return false;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { usedAt: true, expiresAt: true },
  });
  return record ? isResetTokenUsable(record) : false;
}

function InvalidLink() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>This link has expired</CardTitle>
        <CardDescription>
          Reset links work once and expire after 60 minutes. Request a new one and use the
          newest email — older links stop working as soon as a new one is sent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/forgot-password" className={buttonVariants({ className: "w-full" })}>
          Request a new link
        </Link>
        <p className="text-sm text-center text-gray-600">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token || !(await isTokenUsable(token))) return <InvalidLink />;
  return <ResetPasswordForm token={token} />;
}
