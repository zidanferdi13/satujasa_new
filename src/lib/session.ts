import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

/**
 * BUG-18: the session callback copied `organizationId` and `role` off the token but never `id`,
 * even though the token has carried the user id in `sub` since sign-in. Every route that read
 * `session.user.id` therefore handed `undefined` to Prisma, and an undefined nested filter is
 * dropped rather than refused — `member: { userId: undefined }` matched the whole organization.
 * The seat guard was the visible casualty: any member could write berkas as the owner.
 *
 * The mapping lives in a plain function so a test can drive exactly what the callback runs.
 * A token without `sub` yields an empty id, not `undefined`: every consumer treats a falsy
 * user id as "not signed in", so a broken token fails closed instead of widening a query.
 */
export function sessionFromToken<T extends Session>(session: T, token: Partial<JWT>): T {
  if (!session.user) return session;

  session.user.id = token.sub ?? "";
  session.user.organizationId = (token.organizationId as string | null) ?? null;
  session.user.role = token.role as Session["user"]["role"];

  return session;
}
