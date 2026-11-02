import { ChevronDown } from "lucide-react";
import { FAQ_COPY } from "@/lib/landing-copy";

/**
 * FAQ accordion built on <details>/<summary>: keyboard operable (Enter and Space) with no
 * client JavaScript, so it works before hydration and adds nothing to the bundle.
 */
export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-t bg-muted/60">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 md:py-20">
        <h2 className="text-3xl font-bold tracking-tight">{FAQ_COPY.heading}</h2>
        <div className="mt-8">
          {FAQ_COPY.items.map((item) => (
            <details key={item.question} className="group border-b border-border py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-left font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                {item.question}
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
