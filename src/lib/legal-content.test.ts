import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LEGAL_IDENTITY,
  LEGAL_UPDATED,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
  legalTexts,
  type LegalSection,
} from "./legal-content.ts";
import { UI } from "./ui-strings.ts";

/**
 * The legal pages place the CEO's words verbatim. This test is the guard on "verbatim": every
 * string the pages will print must exist in docs/legal-id.md once markdown decoration is removed.
 * It cannot prove the sentence means what the CEO meant — only that we did not edit it.
 */

const source = readFileSync(new URL("../../docs/legal-id.md", import.meta.url), "utf8");

/** Markdown decoration and line wrapping out, single spaces in. Wording is untouched. */
function normalize(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

const sourceText = normalize(source);

test("every privacy sentence is in the source document, word for word", () => {
  for (const text of legalTexts(PRIVACY_SECTIONS)) {
    assert.ok(
      sourceText.includes(normalize(text)),
      `not found verbatim in docs/legal-id.md: ${text.slice(0, 80)}…`
    );
  }
});

test("every terms sentence is in the source document, word for word", () => {
  for (const text of legalTexts(TERMS_SECTIONS)) {
    assert.ok(
      sourceText.includes(normalize(text)),
      `not found verbatim in docs/legal-id.md: ${text.slice(0, 80)}…`
    );
  }
});

test("the blocked retention bullet is absent, not softened", () => {
  for (const text of [...legalTexts(PRIVACY_SECTIONS), ...legalTexts(TERMS_SECTIONS)]) {
    assert.doesNotMatch(text, /BLOCKED/i);
    assert.doesNotMatch(text, /30 hari setelah permintaan/i, "blocked until delete-org-data.ts exists");
    assert.doesNotMatch(text, /segera hadir|coming soon/i);
  }
});

test("build notes and instructions never reach a page", () => {
  const rendered = [...legalTexts(PRIVACY_SECTIONS), ...legalTexts(TERMS_SECTIONS)].join(" ");
  assert.doesNotMatch(rendered, /no NPWP|street address|canonical|Build notes|tanggal rilis/i);
  assert.doesNotMatch(rendered, /\[tanggal rilis\]/);
});

test("the identity line is the one quoted line, not the block around it", () => {
  const quoted = source.split("\n").filter((line) => line.startsWith("> "));
  assert.equal(quoted.length, 1, "expected exactly one block-quoted line in the source");
  assert.equal(quoted[0].slice(2).trim(), LEGAL_IDENTITY);
  // No NPWP row, no street address — not even an empty one.
  assert.doesNotMatch(LEGAL_IDENTITY, /NPWP|Jl\.|Jalan|Ruko/i);
});

test("§2.4 step 4 is the promise keys themselves, one block and not two", () => {
  const payment = TERMS_SECTIONS.find((section) => section.title === "2.4 Pembayaran") as LegalSection;
  const promiseBlocks = payment.blocks.filter((block) => block.kind === "promise");
  assert.equal(promiseBlocks.length, 1);
  const rendered = [...legalTexts(TERMS_SECTIONS)].join(" ");
  // The sentences may exist only through the keys: retyping them is how a promise drifts.
  assert.ok(!rendered.includes(UI.promise.core), "the promise must be rendered from UI.promise, not copied");
  assert.ok(!rendered.includes("maksimal 1 hari kerja"));
});

test("numbers that must match the implementation match it", () => {
  const rendered = [...legalTexts(TERMS_SECTIONS)].join(" ");
  assert.match(rendered, /Rp 99\.000\/bulan — 1 pengguna/);
  assert.match(rendered, /Rp 249\.000\/bulan — 3 pengguna/);
  assert.match(rendered, /7 hari/); // refund window
  // The only uptime sentence allowed: a target, never a guarantee.
  assert.match(rendered, /tidak memberikan jaminan ketersediaan/);
});

test("both pages carry a release date and §1.7 keeps no archive", () => {
  assert.match(LEGAL_UPDATED, /^\d{1,2} [A-Z][a-z]+ \d{4}$/);
  const rendered = [...legalTexts(PRIVACY_SECTIONS)].join(" ");
  assert.match(rendered, /Versi sebelumnya tidak disimpan/);
});
