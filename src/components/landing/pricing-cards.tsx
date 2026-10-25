import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRupiah } from "@/lib/money";
import { PLAN_LIST } from "@/lib/plans";
import { PRICING_COPY, planCtaHref, planCtaLabel } from "@/lib/landing-copy";

/**
 * Pricing cards. Every price string comes from formatRupiah — the only money formatter
 * in the app — so the cards cannot disagree with the billing code or with each other.
 * The Custom card renders no rupiah amount and no "0": its CTA is the "Hubungi Kami"
 * button that opens WhatsApp, not a checkout.
 */
export function PricingCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLAN_LIST.map((plan) => {
        const ctaLabel = planCtaLabel(plan.id);
        const ctaHref = planCtaHref(plan.id);
        const isExternal = ctaHref.startsWith("http");
        return (
          <div
            key={plan.id}
            className={[
              "flex flex-col rounded-xl border bg-card p-6",
              plan.featured
                ? "border-primary shadow-md md:-mt-2 md:mb-2"
                : "border-border",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.featured ? (
                <Badge className="bg-accent text-accent-foreground">
                  {PRICING_COPY.featuredBadge}
                </Badge>
              ) : null}
            </div>

            <div className="mt-4 min-h-16">
              {plan.priceMonthly === null ? (
                <p className="text-2xl font-semibold">{PRICING_COPY.customPriceText}</p>
              ) : (
                <p className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {formatRupiah(plan.priceMonthly)}
                  </span>
                  <span className="text-sm text-muted-foreground">{PRICING_COPY.unit}</span>
                </p>
              )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {plan.operatorLimit === null
                ? PRICING_COPY.customOperatorLine
                : PRICING_COPY.operatorLine(plan.operatorLimit)}
            </p>

            <div className="mt-6">
              {isExternal ? (
                <a
                  href={ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", className: "h-11 w-full" })}
                >
                  {ctaLabel}
                </a>
              ) : (
                <Link href={ctaHref} className={buttonVariants({ className: "h-11 w-full" })}>
                  {ctaLabel}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
