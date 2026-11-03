/**
 * API-side gate for the admin console (A20). Pages use `requireSuperAdmin()` and redirect;
 * routes cannot redirect, so this returns the refusal instead.
 *
 * Authorisation and the structural promise live together: everything under `/api/admin` is
 * reachable only with `User.platformRole = SUPER_ADMIN`, and nothing under it reads files,
 * KTP or transactions — there is no import of those models to forget to guard.
 */
import { auth } from "@/lib/auth";
import { UI } from "@/lib/ui-strings";

type AdminOk = { ok: true; userId: string };
type AdminRefused = { ok: false; status: number; message: string };

export async function adminSession(): Promise<AdminOk | AdminRefused> {
  const session = await auth();
  if (!session?.user) return { ok: false, status: 401, message: UI.common.notSignedIn };
  if (session.user.role !== "SUPER_ADMIN") {
    return { ok: false, status: 403, message: UI.adm.errForbidden };
  }
  // Fail closed (BUG-18): an audit row must name its verifier. A session without an id is
  // refused here rather than recorded as `undefined` — or thrown at the database.
  const userId = session.user.id;
  if (!userId) return { ok: false, status: 401, message: UI.common.notSignedIn };

  return { ok: true, userId };
}
