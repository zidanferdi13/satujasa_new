import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { UI } from "./ui-strings.ts";

// The Designer table, plus A16 which states two display strings verbatim.
const doc = ["ui-strings-id.md", "tdd-amendments.md"]
  .map((name) => readFileSync(new URL(`../../docs/${name}`, import.meta.url), "utf8"))
  .join("\n");

/** Every leaf string (and every template's literal pieces) must exist verbatim in the Designer doc. */
function leaves(node: unknown, path: string, out: [string, string][]) {
  if (typeof node === "string") out.push([path, node]);
  else if (typeof node === "function") {
    const sample = node(...Array(node.length).fill("\u0000"));
    for (const piece of String(sample).split("\u0000")) if (piece.trim()) out.push([path, piece]);
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) leaves(value, `${path}.${key}`, out);
  }
}

test("every UI string is copied verbatim from docs/ui-strings-id.md", () => {
  const all: [string, string][] = [];
  leaves(UI, "UI", all);
  const missing = all.filter(([, text]) => !doc.includes(text));
  assert.deepEqual(missing, []);
});

test("no file delete action reaches the UI (A17)", () => {
  assert.equal(JSON.stringify(UI).includes("Hapus"), false);
});

test("A21/A23: the promise is one pair of keys, imported everywhere, never retyped", () => {
  const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
  const sources = [
    src("./landing-copy.ts"),
    src("../app/dashboard/owner/page.tsx"),
    src("../app/page.tsx"),
  ].join("\n");
  // Retyping the sentence anywhere outside ui-strings.ts is how a second phrasing starts.
  assert.equal(sources.includes("maksimal 1 hari kerja"), false);
  assert.match(src("./landing-copy.ts"), /UI\.promise\.core/);
  assert.match(src("../app/dashboard/owner/page.tsx"), /UI\.promise\.core[\s\S]*UI\.promise\.weekend/);
  assert.equal(/2\s*[×x]\s*24/i.test(JSON.stringify(UI)), false);
});

test("A20: co.failed has no trigger and is not wired", () => {
  const hits = execSync("git grep -l 'co\\.failed' -- src ':!src/lib/ui-strings.ts' ':!src/lib/ui-strings.test.ts' || true", {
    cwd: new URL("../..", import.meta.url).pathname,
  }).toString();
  assert.equal(hits.trim(), "");
});

test("A23: every ownership value has a label, and Instansi is not one", () => {
  const values = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8")
    .match(/enum OwnershipType \{([^}]*)\}/)![1].trim().split(/\s+/);
  assert.deepEqual(Object.keys(UI.ownership), values);
  assert.equal(JSON.stringify(UI).includes("Instansi"), false);
});
