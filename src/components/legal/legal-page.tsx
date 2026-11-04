import type { ReactNode } from "react";
import { Footer, SiteHeader } from "@/components/landing/landing-sections";
import {
  LEGAL_IDENTITY,
  LEGAL_UPDATED,
  type LegalBlock,
  type LegalSection,
} from "@/lib/legal-content";
import { UI } from "@/lib/ui-strings";

/**
 * Both legal pages are the same document shape, so they are one component: two hand-built pages
 * would drift in spacing first, wording second. Layout follows §18 — single column, `max-w-prose`,
 * line height 1.7, headings carrying the file's numbering so a support reply can cite "lihat 2.4".
 *
 * No sentence lives here. Everything printed comes from legal-content.ts, which the test pins to
 * docs/legal-id.md word for word.
 */

type Block = LegalBlock;
type NumberedItem = { text: string } | { promise: true };

function Group({ items }: { items: readonly NumberedItem[] }) {
  return (
    <ol className="mt-3 list-decimal space-y-2 pl-5">
      {items.map((item, index) =>
        "promise" in item ? (
          // §2.4 step 4: two sentences from one pair of keys, nothing else in the step (A21).
          <li key={index}>
            <p>{UI.promise.core}</p>
            <p className="mt-2">{UI.promise.weekend}</p>
          </li>
        ) : (
          <li key={index}>{item.text}</li>
        )
      )}
    </ol>
  );
}

/**
 * Consecutive ordered blocks become one list even when a promise block splits them, so §2.4
 * numbers 1–5 instead of restarting at 1 after step 4.
 */
function blocks(items: readonly Block[]) {
  const out: ReactNode[] = [];
  let numbered: NumberedItem[] = [];
  const flush = () => {
    if (numbered.length) {
      out.push(<Group key={`ol-${out.length}`} items={numbered} />);
      numbered = [];
    }
  };

  for (const block of items) {
    if (block.kind === "ol") {
      numbered.push(...block.items.map((text) => ({ text })));
      continue;
    }
    if (block.kind === "promise") {
      numbered.push({ promise: true });
      continue;
    }
    flush();
    if (block.kind === "p") {
      out.push(
        <p key={`p-${out.length}`} className="mt-3">
          {block.text}
        </p>
      );
    } else {
      out.push(
        <ul key={`ul-${out.length}`} className="mt-3 list-disc space-y-2 pl-5">
          {block.items.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      );
    }
  }
  flush();
  return out;
}

export function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: readonly LegalSection[];
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-prose flex-1 px-4 py-12 text-base leading-[1.7]">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{UI.legal.updated(LEGAL_UPDATED)}</p>
        {/* §18: the identity line, exactly this and nothing else — no street address, no NPWP. */}
        <p className="mt-1 text-sm text-muted-foreground">{LEGAL_IDENTITY}</p>

        {sections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            {blocks(section.blocks)}
          </section>
        ))}
      </main>
      <Footer anchorBase="/" />
    </div>
  );
}
