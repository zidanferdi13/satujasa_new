import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
