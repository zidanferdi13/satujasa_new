# Landing Page Copy — LOCKED (Indonesian)

Source: Designer handoff, approved by PM. **Do not paraphrase, shorten, or rewrite.**
Build verbatim. Any copy change requires Designer approval in Thread 3.

Route: public `/` (separate from `/dashboard`).
Terminology (CEO): always **SAMSAT**, never "samas". Printed document = **Surat Jalan**.
Language: Bahasa Indonesia throughout.
Sections: Navbar → Hero → Features (6) → Pricing (3) → FAQ (6) → CTA banner → Footer.
Breakpoints: 0 / 768 / 1024 / 1280.

---

## Navbar
- "Masuk" (outline) + "Daftar" (primary)

## Hero
- H1: Kelola Biro Jasa Anda dalam Satu Dashboard
- Sub: Atur operator, pantau berkas, dan lihat laporan keuangan Anda — tanpa spreadsheet.
- Buttons: "Daftar Sekarang" (primary) + "Masuk" (outline)
- Microcopy under buttons: Mulai dari Rp 99.000/bulan.

## Features
Section title: Semua yang Anda Butuhkan untuk Operasional

1. Manajemen Operator — Tambah dan kelola operator sesuai kapasitas paket Anda. Setiap operator punya akses sendiri.
2. Pelacakan Berkas — Pantau status setiap berkas dari masuk hingga selesai, lengkap dengan riwayat perubahannya.
3. Laporan Keuangan Otomatis — ⚠ PENDING DESIGNER WORDING. Old line ("…dikurangi pembayaran samas dan biaya layanan.") is WRONG and must not ship.
   CEO ruling (b): revenue = pembayaran pelanggan − biaya SAMSAT = biaya jasa. Required meaning: "Pendapatan dihitung otomatis: pembayaran pelanggan dikurangi biaya SAMSAT, yaitu jasa Anda." Designer writes final wording; spelling is always SAMSAT.
4. Pembayaran Online — Langganan dibayar lewat Midtrans. Paket aktif otomatis begitu pembayaran berhasil.
5. Hak Akses Owner & Operator — Owner melihat seluruh data. Operator hanya melihat berkas yang ditugaskan kepadanya.
6. Ekspor PDF & Excel — Unduh laporan harian, bulanan, atau rentang tanggal dalam format PDF dan Excel.

## Pricing cards
Source of truth for values: `src/lib/plans.ts`. Never hardcode a price in JSX.

- BASIC: name "Basic", price "Rp 99.000", unit "/bulan", operator line "1 operator", button "Pilih Basic" (primary).
- PRO: name "Pro", price "Rp 249.000", unit "/bulan", operator line "3 operator", badge "Paling Populer" (small Amber pill with **dark** text `#0F172A`), button "Pilih Pro" (primary). Card gets an Indigo border and a slight shadow.
- CUSTOM: name "Custom", price text "Hubungi Kami" (H3 size, **no rupiah formatting**), operator line "Jumlah operator sesuai kebutuhan", button "Hubungi Kami" (outline) → `https://wa.me/6281319535441?text=<prefilled Indonesian message>` (URL-encoded, Indonesian, e.g. "Halo, saya ingin bertanya tentang paket Custom Biro Jasa."). WA number confirmed by client 2026-10-25. Same href for the footer "Hubungi Kami" link.
- Caption under the cards: Harga dalam Rupiah. Ditagih bulanan.
- Nothing about free trials, anywhere.

## FAQ (accordion, 6 items)
1. Berapa lama proses aktivasi setelah pembayaran? — Langsung. Setelah Midtrans mengonfirmasi pembayaran, paket Anda aktif otomatis.
2. Apakah ada masa uji coba gratis? — Tidak. Paket langsung aktif setelah pembayaran pertama.
3. Berapa operator yang bisa saya tambahkan? — Basic mendukung 1 operator, Pro 3 operator. Butuh lebih banyak? Ajukan paket Custom lewat Hubungi Kami.
   ⚠ PENDING DESIGNER REVISION: CEO seat rule (owner operating consumes a seat) makes this answer incomplete. Do not ship FAQ #3 until Designer re-issues it.
4. Bisakah saya upgrade dari Basic ke Pro? — Bisa. Upgrade diproses sebagai pembayaran baru dan batas operator langsung bertambah. Sisa periode Basic tidak dihitung prorata.
5. Apakah data saya aman? — Data setiap organisasi dipisahkan di level database, dan setiap akses difilter berdasarkan peran pengguna.
6. Format laporan apa yang tersedia? — PDF dan Excel, untuk laporan harian, bulanan, atau rentang tanggal pilihan Anda.

## CTA banner
- "Siap merapikan operasional biro jasa Anda?" / button "Daftar Sekarang"

## Footer
- Produk: Fitur, Harga, FAQ  (in-page anchors `#fitur`, `#harga`, `#faq` — these exist)
- Perusahaan, Bantuan, Legal columns: **OMITTED for MVP** until real destinations exist (PM + CEO ruling). Do not reserve space, do not grey out.
  - Kontak / Hubungi Kami → added when the WhatsApp number arrives.
  - Kebijakan Privasi / Syarat & Ketentuan → added when CEO-drafted legal content exists; required before Midtrans production.
  - Tentang, Panduan → no content owner; dropped from MVP.
- Business identity block:
  - Zidan Ferdiansyah
  - Pondok Ungu Permai Blok AL 8 No 9, Kel. Bahagia, Kec. Babelan, Kab. Bekasi
  - zidanferdi13@gmail.com
  - NPWP: **omitted** until the client confirms. Never render a blank NPWP field.
  - Midtrans merchant is registered as **perorangan** (individual), so the legal name + address above are what must appear.
  - PENDING CLIENT: approval to publish the home address publicly.
- Bottom: © 2026 Biro Jasa. Hak cipta dilindungi.

**No dead links.** Every footer link resolves to a real section or route, or it is removed from the footer for the MVP.

---

## Theme tokens (light mode only)
Put in the `:root` block of `src/app/globals.css`; use Inter for `--font-sans`.
Delete the `prefers-color-scheme: dark` block and the `font-family: Arial` rule on `body`.

- --primary #4F46E5 · --primary-foreground #FFFFFF
- --secondary #F1F5F9 · --secondary-foreground #0F172A
- --accent #F59E0B · --accent-foreground #0F172A  ← amber never pairs with white text
- --background #FFFFFF · --foreground #0F172A
- --muted #F8FAFC · --muted-foreground #64748B
- --card #FFFFFF · --border / --input #E2E8F0 · --ring #6366F1
- --destructive #E11D48
- success (custom) #059669
- --radius 0.5rem

Logo: text wordmark "Biro Jasa", Inter 700, Indigo. No image asset exists.

## QA visual criteria
- Body text ≥ 4.5:1 contrast; amber never carries white text.
- Focus ring visible on every interactive element.
- No horizontal scroll at 360px.
- Touch targets ≥ 44px on mobile.
- FAQ accordion operable with Enter/Space.
- Prices render as "Rp 99.000" / "Rp 249.000" — never "99000", never "Rp 99,000".
- Custom card shows no rupiah symbol and no "0".
