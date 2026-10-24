import ResetPasswordForm from "./reset-password-form";

/** The token arrives in the URL, so this page renders per request, never prerendered. */
export const instant = false;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
