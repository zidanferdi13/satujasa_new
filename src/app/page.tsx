import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FaqSection } from "@/components/landing/faq-section";
import { Features, Footer, Hero, SiteHeader } from "@/components/landing/landing-sections";
import { PricingCards } from "@/components/landing/pricing-cards";
import { CTA_COPY, PRICING_COPY } from "@/lib/landing-copy";

/**
 * Public landing page. All copy comes from src/lib/landing-copy.ts (locked, verbatim);
 * all prices come from PLANS through formatRupiah. Changing text here instead of there
 * is how the page drifts from the approved copy, so do not inline strings.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />

        <section id="harga" className="scroll-mt-20 border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              {/* Visually hidden: the pricing section has no approved heading of its own,
                  and "Harga" is locked copy (footer link label), so no new copy is invented. */}
              <h2 className="sr-only">Harga</h2>
            </div>
            <div className="mt-10">
              <PricingCards />
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {PRICING_COPY.caption}
            </p>
          </div>
        </section>

        <FaqSection />

        <section className="border-t bg-primary text-primary-foreground">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance">{CTA_COPY.title}</h2>
            <Link
              href="/register"
              className={buttonVariants({
                variant: "secondary",
                className: "h-12 bg-background px-6 text-base text-foreground hover:bg-background/90",
              })}
            >
              {CTA_COPY.button}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
