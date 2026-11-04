/**
 * Legal pages (item 8). The words are the CEO's, placed verbatim from `docs/legal-id.md`:
 * Designer owns layout, Developer owns neither sentence. Nothing here is retyped prose in the
 * sense of being rewritten — but it IS transcription, so `legal-content.test.ts` checks every
 * block against the source file word for word. A drift between this module and the document
 * fails the suite rather than reaching a public page.
 *
 * Two things are deliberately absent:
 * - the [BLOCKED] bullet in §1.4 (needs `scripts/delete-org-data.ts`). Not greyed out, not
 *   "segera hadir": absent until the script exists.
 * - everything outside the numbered sections: the header block, the [tanggal rilis] placeholder
 *   and the build notes are instructions to us, not copy. Only the identity line is rendered.
 */

export const LEGAL_IDENTITY =
  "Zidan Ferdiansyah · Kab. Bekasi, Jawa Barat · zidanferdi13@gmail.com · WhatsApp 081319535441";

/** One constant per page, because §1.7 keeps no version archive: the date is the change signal. */
export const LEGAL_UPDATED = "4 November 2026";

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: readonly string[] }
  | { kind: "ol"; items: readonly string[] }
  /** §2.4 step 4: rendered from `UI.promise`, never retyped (A21). */
  | { kind: "promise" };

export type LegalSection = {
  /** Exactly the heading as it appears in the document, numbering included. */
  title: string;
  blocks: readonly LegalBlock[];
};

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    title: "1.1 Data yang kami kumpulkan",
    blocks: [
      {
        kind: "ul",
        items: [
          "Data berkas kendaraan: nama pemilik, NIK sesuai KTP, nomor kendaraan, jenis kepemilikan, jenis jasa, harga perkiraan dan harga akhir, status berkas.",
          "Data akun: nama, alamat email, peran (owner atau operator).",
          "Data pembayaran: kode pembayaran, paket, jumlah, tanggal, status, serta bukti transfer yang Anda unggah.",
        ],
      },
    ],
  },
  {
    title: "1.2 Dasar dan tujuan pemrosesan",
    blocks: [
      {
        kind: "p",
        text: "Pemrosesan dilakukan atas persetujuan Anda dan untuk pelaksanaan perjanjian layanan (UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi). Tujuannya hanya: mencatat berkas, mencetak Surat Jalan untuk diserahkan ke SAMSAT, menghitung pendapatan, dan mengelola langganan.",
      },
    ],
  },
  {
    title: "1.3 Siapa yang dapat mengakses",
    blocks: [
      {
        kind: "ul",
        items: [
          "Data berkas hanya dapat diakses oleh akun organisasi Anda dan operator di bawahnya.",
          "Admin platform hanya dapat melihat nama organisasi, email owner, data pembayaran, dan bukti transfer. Admin platform tidak dapat melihat data berkas, NIK, transaksi, atau laporan.",
          "Data tidak dijual dan tidak dibagikan, kecuali diwajibkan hukum yang berlaku.",
        ],
      },
    ],
  },
  {
    title: "1.4 Penyimpanan dan retensi",
    blocks: [
      {
        kind: "ul",
        items: [
          "Data berkas dan data akun disimpan selama langganan aktif, dan setelah langganan berakhir tetap disimpan sampai Anda meminta penghapusan, agar Anda dapat memperpanjang tanpa kehilangan riwayat.",
          "Bukti transfer dihapus 90 hari setelah pembayaran diverifikasi. Setelah itu kami menyimpan catatan pembayaran (jumlah, tanggal, status, verifikator) tanpa gambar.",
          // The [BLOCKED] bullet is not here on purpose. It returns with scripts/delete-org-data.ts.
        ],
      },
    ],
  },
  {
    title: "1.5 Hak Anda",
    blocks: [
      {
        kind: "p",
        text: "Anda berhak mengakses, mengekspor, memperbaiki, dan meminta penghapusan data Anda, serta menarik persetujuan. Permintaan dikirim ke zidanferdi13@gmail.com.",
      },
    ],
  },
  {
    title: "1.6 Keamanan",
    blocks: [
      {
        kind: "p",
        text: "Setiap permintaan ke server diperiksa ulang berdasarkan peran dan organisasi Anda, dan data hanya diambil untuk organisasi yang berhak. Kata sandi disimpan dalam bentuk hash. Koneksi menggunakan HTTPS pada lingkungan produksi. Cadangan harian dibuat dalam bentuk terenkripsi, dan kunci dekripsinya dipegang oleh penyelenggara layanan.",
      },
    ],
  },
  {
    title: "1.7 Perubahan",
    blocks: [
      {
        kind: "p",
        text: "Perubahan kebijakan diumumkan di halaman ini. Versi sebelumnya tidak disimpan; tanggal berlaku diperbarui setiap kali ada perubahan.",
      },
    ],
  },
];

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    title: "2.1 Layanan",
    blocks: [
      {
        kind: "p",
        text: "Biro Jasa adalah perangkat lunak berbasis web untuk mencatat berkas jasa biro (perpanjangan STNK, pergantian plat, mutasi, SIM, dan sejenisnya), mencetak Surat Jalan, dan menghitung pendapatan. Layanan tidak menjamin waktu proses di SAMSAT dan bukan pihak dalam transaksi antara Anda dan pelanggan Anda.",
      },
    ],
  },
  {
    title: "2.2 Akun dan peran",
    blocks: [
      {
        kind: "p",
        text: "Satu organisasi memiliki satu owner. Owner bertanggung jawab atas seluruh aktivitas operator yang ia buat, termasuk data yang mereka masukkan.",
      },
    ],
  },
  {
    title: "2.3 Paket, harga, dan batas pengguna",
    blocks: [
      {
        kind: "ul",
        items: [
          "Basic — Rp 99.000/bulan — 1 pengguna",
          "Pro — Rp 249.000/bulan — 3 pengguna",
          "Custom — harga dan jumlah pengguna sesuai kesepakatan, diatur lewat WhatsApp",
        ],
      },
      {
        kind: "p",
        text: "\"Pengguna\" adalah owner dan/atau operator yang mengerjakan berkas. Jika owner ikut mengerjakan berkas, akun owner memakai satu slot. Owner yang hanya melihat laporan tidak memakai slot. Tidak ada masa uji coba gratis dan tidak ada paket gratis.",
      },
    ],
  },
  {
    title: "2.4 Pembayaran",
    blocks: [
      {
        kind: "ol",
        items: [
          "Owner memilih paket; sistem membuat kode pembayaran.",
          "Owner mentransfer jumlah yang tertera ke rekening BCA yang ditampilkan di dalam akun.",
          "Owner mengunggah bukti transfer atau menghubungi kami lewat WhatsApp dengan menyertakan kode pembayaran.",
        ],
      },
      { kind: "promise" },
      {
        kind: "ol",
        items: [
          // Continues the list at 5; the renderer keeps numbering across the promise block.
          "Akses aktif hanya setelah pembayaran berstatus PAID.",
        ],
      },
      {
        kind: "p",
        text: "Pembayaran yang ditolak dapat diperbaiki dan dikirim ulang.",
      },
    ],
  },
  {
    title: "2.5 Perpanjangan, upgrade, dan downgrade",
    blocks: [
      {
        kind: "ul",
        items: [
          "Perpanjangan paket yang sama ditambahkan ke akhir periode berjalan; sisa hari tidak hilang.",
          "Upgrade berlaku setelah bukti transfer diverifikasi, dan batas pengguna bertambah saat itu. Sisa hari paket lama tidak dihitung prorata dan tidak dikembalikan.",
          "Downgrade tidak tersedia selama paket yang lebih tinggi masih aktif. Anda dapat membeli paket lebih rendah setelah periode berjalan berakhir, dan memilih operator yang tetap aktif sesuai batas paket baru.",
        ],
      },
    ],
  },
  {
    title: "2.6 Pengembalian dana",
    blocks: [
      {
        kind: "p",
        text: "Pengembalian dana penuh diberikan bila diminta dalam 7 hari sejak pembayaran dan belum ada satu berkas pun yang dicatat. Setelah ada berkas tercatat atau setelah 7 hari, pembayaran tidak dapat dikembalikan; akses tetap berjalan sampai akhir periode yang sudah dibayar. Pengembalian dana dilakukan melalui transfer bank ke rekening pengirim, paling lambat 7 hari kerja setelah disetujui.",
      },
    ],
  },
  {
    title: "2.7 Kewajiban pengguna",
    blocks: [
      {
        kind: "p",
        text: "Anda hanya boleh memasukkan data kendaraan dan data pribadi yang Anda berhak proses, dan wajib memiliki izin dari pemilik data. Anda dilarang menggunakan layanan untuk memalsukan dokumen.",
      },
    ],
  },
  {
    title: "2.8 Ketersediaan layanan",
    blocks: [
      {
        kind: "p",
        text: "Kami menargetkan ketersediaan 99%, tetapi tidak memberikan jaminan ketersediaan (SLA). Layanan dapat dihentikan sementara untuk pemeliharaan.",
      },
    ],
  },
  {
    title: "2.9 Penangguhan dan penghentian",
    blocks: [
      {
        kind: "p",
        text: "Pelanggaran ketentuan ini atau penyalahgunaan dapat menyebabkan penonaktifan organisasi. Data tetap disimpan sesuai kebijakan retensi pada Kebijakan Privasi.",
      },
    ],
  },
  {
    title: "2.10 Hukum yang berlaku",
    blocks: [
      {
        kind: "p",
        text: "Ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan secara musyawarah terlebih dahulu.",
      },
    ],
  },
];

/** Every sentence the page will print, for the source check. */
export function legalTexts(sections: readonly LegalSection[]): string[] {
  return sections.flatMap((section) => [
    section.title,
    ...section.blocks.flatMap((block) => {
      if (block.kind === "p") return [block.text];
      if (block.kind === "promise") return [];
      return [...block.items];
    }),
  ]);
}
