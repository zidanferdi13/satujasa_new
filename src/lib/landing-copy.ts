/**
 * Landing page copy (docs/landing-copy-id.md, LOCKED by Designer + PM).
 *
 * Verbatim. Do not paraphrase, shorten or "improve" a string here: any change needs
 * Designer approval in Thread 3. Prices come from PLANS and are turned into text by
 * formatRupiah, so no rupiah amount is ever typed twice.
 *
 * Two items are deliberately absent, both PENDING Designer copy, both ordered by PM to be
 * omitted rather than shipped wrong:
 * - FAQ #3 ("Berapa operator yang bisa saya tambahkan?") — needs a re-issue under the CEO
 *   seat rule.
 * - Feature "Laporan Keuangan Otomatis" — its body line stated the old revenue formula
 *   (it subtracted the service fee too). Per the CEO ruling revenue = customer
 *   payment − SAMSAT cost = biaya jasa, and serviceFee is never subtracted. The feature
 *   returns with Designer's replacement wording.
 */
import { formatRupiah } from "./money.ts";
import { PLANS, type PlanId } from "./plans.ts";

export type Feature = { readonly title: string; readonly body: string };

/**
 * Custom plan CTA and the footer "Hubungi Kami" link (both point here). The number was
 * confirmed by the client; the prefilled message is the one in docs/landing-copy-id.md.
 */
export const WHATSAPP_URL =
  "https://wa.me/6281319535441?text=" +
  encodeURIComponent("Halo, saya ingin bertanya tentang paket Custom Biro Jasa.");
export type FaqItem = { readonly question: string; readonly answer: string };

export const NAV_COPY = {
  signIn: "Masuk",
  signUp: "Daftar",
} as const;

export const HERO_COPY = {
  title: "Kelola Biro Jasa Anda dalam Satu Dashboard",
  subtitle:
    "Atur operator, pantau berkas, dan lihat laporan keuangan Anda — tanpa spreadsheet.",
  primaryCta: "Daftar Sekarang",
  secondaryCta: "Masuk",
  microcopy: `Mulai dari ${formatRupiah(PLANS.BASIC.priceMonthly)}/bulan.`,
} as const;

export const FEATURES_COPY = {
  title: "Semua yang Anda Butuhkan untuk Operasional",
  items: [
    {
      title: "Manajemen Operator",
      body: "Tambah dan kelola operator sesuai kapasitas paket Anda. Setiap operator punya akses sendiri.",
    },
    {
      title: "Pelacakan Berkas",
      body: "Pantau status setiap berkas dari masuk hingga selesai, lengkap dengan riwayat perubahannya.",
    },
    {
      title: "Pembayaran Online",
      body: "Langganan dibayar lewat Midtrans. Paket aktif otomatis begitu pembayaran berhasil.",
    },
    {
      title: "Hak Akses Owner & Operator",
      body: "Owner melihat seluruh data. Operator hanya melihat berkas yang ditugaskan kepadanya.",
    },
    {
      title: "Ekspor PDF & Excel",
      body: "Unduh laporan harian, bulanan, atau rentang tanggal dalam format PDF dan Excel.",
    },
  ] as readonly Feature[],
} as const;

export const PRICING_COPY = {
  caption: "Harga dalam Rupiah. Ditagih bulanan.",
  unit: "/bulan",
  featuredBadge: "Paling Populer",
  customPriceText: "Hubungi Kami",
  customOperatorLine: "Jumlah operator sesuai kebutuhan",
  operatorLine: (limit: number) => `${limit} operator`,
} as const;

/** Button label per plan. Every plan has one now that the WhatsApp number exists. */
export function planCtaLabel(id: PlanId): string {
  switch (id) {
    case "BASIC":
      return "Pilih Basic";
    case "PRO":
      return "Pilih Pro";
    default:
      return "Hubungi Kami";
  }
}

/**
 * Where each card's button goes. Paid plans start checkout through registration; Custom
 * is negotiated over WhatsApp, so it leaves the site.
 */
export function planCtaHref(id: PlanId): string {
  return id === "CUSTOM" ? WHATSAPP_URL : "/register";
}

/** FAQ items 1, 2, 4, 5, 6 — see the file header for why 3 is missing. */
export const FAQ_COPY = {
  items: [
    {
      question: "Berapa lama proses aktivasi setelah pembayaran?",
      answer:
        "Langsung. Setelah Midtrans mengonfirmasi pembayaran, paket Anda aktif otomatis.",
    },
    {
      question: "Apakah ada masa uji coba gratis?",
      answer: "Tidak. Paket langsung aktif setelah pembayaran pertama.",
    },
    {
      question: "Bisakah saya upgrade dari Basic ke Pro?",
      answer:
        "Bisa. Upgrade diproses sebagai pembayaran baru dan batas operator langsung bertambah. Sisa periode Basic tidak dihitung prorata.",
    },
    {
      question: "Apakah data saya aman?",
      answer:
        "Data setiap organisasi dipisahkan di level database, dan setiap akses difilter berdasarkan peran pengguna.",
    },
    {
      question: "Format laporan apa yang tersedia?",
      answer:
        "PDF dan Excel, untuk laporan harian, bulanan, atau rentang tanggal pilihan Anda.",
    },
  ] as readonly FaqItem[],
} as const;

export const CTA_COPY = {
  title: "Siap merapikan operasional biro jasa Anda?",
  button: "Daftar Sekarang",
} as const;

/**
 * Footer: the Produk column only. Perusahaan / Bantuan / Legal are omitted for the MVP
 * (no placeholders, no greyed links, no reserved space) because their destinations do
 * not exist yet. Legal links return together with the legal pages.
 */
export const FOOTER_COPY = {
  productTitle: "Produk",
  productLinks: [
    { label: "Fitur", href: "#fitur" },
    { label: "Harga", href: "#harga" },
    { label: "FAQ", href: "#faq" },
  ] as readonly { readonly label: string; readonly href: string }[],
  /** Added when the WhatsApp number arrived. Same destination as the Custom card. */
  contactLink: { label: "Hubungi Kami", href: WHATSAPP_URL },
  copyright: "© 2026 Biro Jasa. Hak cipta dilindungi.",
} as const;

export const BRAND_COPY = {
  wordmark: "Biro Jasa",
} as const;
