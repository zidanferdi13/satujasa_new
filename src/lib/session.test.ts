import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { sessionFromToken } from "./session.ts";

const src = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

/** A JWT as next-auth hands it to the session callback after a credentials sign-in. */
function token(overrides: Record<string, unknown> = {}) {
  return { sub: "user_1", role: "OWNER" as const, organizationId: "org_1", ...overrides };
}

function session() {
  return {
    user: {
      id: "",
      name: "Owner",
      email: "owner@demo.test",
      organizationId: null,
      role: "OWNER" as const,
    },
    expires: "2099-01-01T00:00:00.000Z",
  };
}

// BUG-18: 36 tests passed while every request ran with an undefined user id, because none of
// them drove a session. This one does — `session.user.id` must survive sign-in.
test("BUG-18: the session carries the user id from the token", () => {
  const s = sessionFromToken(session(), token());
  assert.equal(s.user.id, "user_1");
  assert.equal(s.user.organizationId, "org_1");
  assert.equal(s.user.role, "OWNER");
});

// Fail closed: a token without `sub` must not become a Prisma filter that matches everything.
test("BUG-18: a token with no sub yields a falsy id, never undefined", () => {
  const s = sessionFromToken(session(), token({ sub: undefined }));
  assert.equal(s.user.id, "");
  assert.ok(!s.user.id);
});

test("BUG-18: the session callback maps through sessionFromToken", () => {
  const auth = src("../lib/auth.ts");
  const callback = auth.slice(auth.indexOf("async session("));
  assert.match(callback, /sessionFromToken\(session, token\)/);
  // The inline copy this bug lived in must not come back.
  assert.doesNotMatch(callback, /session\.user\.(organizationId|role)\s*=/);
});

// Fail closed at the query: operatorIdFor (every operator/seat lookup) refuses a falsy user id
// before Prisma sees it. It imports the Prisma client, which node:test cannot load through the
// "@/" alias, so this pins the guard structurally: first statement, nothing else before it.
test("BUG-18: operatorIdFor(undefined, orgId) returns null before any query", () => {
  const queries = src("./file-queries.ts");
  const body = queries.slice(queries.indexOf("export async function operatorIdFor"));
  const guard = body.indexOf("if (!userId || !organizationId) return null;");
  assert.ok(guard > 0, "falsy guard missing");
  assert.ok(guard < body.indexOf("prisma."), "guard must run before the query");
});

// No route may hand session.user.id straight to a Prisma filter again; they go through the guard.
test("BUG-18: no raw session.user.id reaches a Prisma where clause", () => {
  const hits = execSync("git grep -nE 'userId: session\\.user\\.id' -- src || true", {
    cwd: new URL("../..", import.meta.url).pathname,
  })
    .toString()
    .trim();
  assert.equal(hits, "");
});
