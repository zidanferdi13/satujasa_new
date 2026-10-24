/**
 * The only place that sends mail. While no email provider is configured the link
 * goes to the server console instead, so the reset flow works end-to-end without
 * an account (PM directive: keep the provider decision out of the code path).
 */
export type EmailChannel = "resend" | "console";

const FROM = process.env.RESEND_FROM ?? "Biro Jasa <onboarding@resend.dev>";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<EmailChannel> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[password-reset] ${to} -> ${resetUrl}`);
    return "console";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: "Reset your Biro Jasa password",
      text: `Open this link to set a new password. It expires in 60 minutes.\n\n${resetUrl}\n\nIf you did not ask for this, ignore this email.`,
    }),
  });

  if (!response.ok) {
    // Log and continue: the caller must not reveal whether the address exists.
    console.error(`[password-reset] Resend failed (${response.status}): ${await response.text()}`);
    return "console";
  }

  return "resend";
}
