import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  BRAND_COPY,
  FEATURES_COPY,
  FOOTER_COPY,
  HERO_COPY,
  NAV_COPY,
} from "@/lib/landing-copy";

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {BRAND_COPY.wordmark}
        </Link>
        <nav aria-label="Navigasi utama" className="flex items-center gap-2">
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", className: "h-11 px-4" })}
          >
            {NAV_COPY.signIn}
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "default", className: "h-11 px-4" })}
          >
            {NAV_COPY.signUp}
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 pt-16 pb-12 text-center md:pt-24">
      <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
        {HERO_COPY.title}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
        {HERO_COPY.subtitle}
      </p>
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Link
          href="/register"
          className={buttonVariants({ className: "h-12 px-6 text-base" })}
        >
          {HERO_COPY.primaryCta}
        </Link>
        <Link
          href="/login"
          className={buttonVariants({
            variant: "outline",
            className: "h-12 px-6 text-base",
          })}
        >
          {HERO_COPY.secondaryCta}
        </Link>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{HERO_COPY.microcopy}</p>
    </section>
  );
}

function Features() {
  return (
    <section id="fitur" className="scroll-mt-20 border-t bg-muted/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {FEATURES_COPY.title}
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES_COPY.items.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-lg font-bold tracking-tight text-primary">{BRAND_COPY.wordmark}</p>
        <nav aria-label="Produk">
          <h2 className="text-sm font-semibold">{FOOTER_COPY.productTitle}</h2>
          <ul className="mt-3 space-y-2">
            {FOOTER_COPY.productLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted-foreground">
          {FOOTER_COPY.copyright}
        </p>
      </div>
    </footer>
  );
}

export { SiteHeader, Hero, Features, Footer };
