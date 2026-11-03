# Legal Copy — Biro Jasa (CEO draft v2)

Status: **CEO-approved content.** Designer places these strings; Developer does not rewrite them.
Claims marked **[BLOCKED]** must not ship until the named script exists (A11: claims must match
implementation).

v2 (PM five-claim review): WhatsApp number dropped from collected data; retention reworded;
DB-level separation removed until RLS; backup claim kept, page gated on `scripts/backup.sh`;
§2.4 step 4 imports the promise keys; one canonical phone format.

**Identity line — this is rendered copy, on both pages, and nothing more than this line:**

> Zidan Ferdiansyah · Kab. Bekasi, Jawa Barat · zidanferdi13@gmail.com · WhatsApp 081319535441

Rules about that line (no street address, no NPWP row, canonical number format) are instructions,
not copy. They live in the build notes at the end of this file. **Do not render anything from this
header except the line above.**

---

## 1. Kebijakan Privasi (`/kebijakan-privasi`)

**Berlaku sejak:** [tanggal rilis] · **Penyelenggara:** Zidan Ferdiansyah, Kab. Bekasi, Jawa Barat.

### 1.1 Data yang kami kumpulkan
- **Data berkas kendaraan:** nama pemilik, NIK sesuai KTP, nomor kendaraan, jenis kepemilikan,
  jenis jasa, harga perkiraan dan harga akhir, status berkas.
- **Data akun:** nama, alamat email, peran (owner atau operator).
- **Data pembayaran:** kode pembayaran, paket, jumlah, tanggal, status, serta bukti transfer yang
  Anda unggah.

### 1.2 Dasar dan tujuan pemrosesan
Pemrosesan dilakukan atas **persetujuan Anda** dan untuk **pelaksanaan perjanjian layanan**
(UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi). Tujuannya hanya: mencatat berkas,
mencetak Surat Jalan untuk diserahkan ke SAMSAT, menghitung pendapatan, dan mengelola langganan.

### 1.3 Siapa yang dapat mengakses
- Data berkas hanya dapat diakses oleh **akun organisasi Anda dan operator di bawahnya**.
- **Admin platform** hanya dapat melihat nama organisasi, email owner, data pembayaran, dan bukti
  transfer. Admin platform **tidak dapat** melihat data berkas, NIK, transaksi, atau laporan.
- Data tidak dijual dan tidak dibagikan, kecuali diwajibkan hukum yang berlaku.

### 1.4 Penyimpanan dan retensi
- Data berkas dan data akun disimpan **selama langganan aktif**, dan setelah langganan berakhir
  tetap disimpan **sampai Anda meminta penghapusan**, agar Anda dapat memperpanjang tanpa
  kehilangan riwayat.
- **Bukti transfer dihapus 90 hari setelah pembayaran diverifikasi.** Setelah itu kami menyimpan
  catatan pembayaran (jumlah, tanggal, status, verifikator) tanpa gambar.
- **[BLOCKED — needs `scripts/delete-org-data.ts`]** Penghapusan data atas permintaan dilakukan
  paling lambat 30 hari setelah permintaan dikonfirmasi.

### 1.5 Hak Anda
Anda berhak mengakses, mengekspor, memperbaiki, dan meminta penghapusan data Anda, serta menarik
persetujuan. Permintaan dikirim ke zidanferdi13@gmail.com.

### 1.6 Keamanan
Setiap permintaan ke server diperiksa ulang berdasarkan peran dan organisasi Anda, dan data hanya
diambil untuk organisasi yang berhak. Kata sandi disimpan dalam bentuk hash. Koneksi
menggunakan HTTPS pada lingkungan produksi. Cadangan harian dibuat dalam bentuk terenkripsi, dan
kunci dekripsinya dipegang oleh penyelenggara layanan.

### 1.7 Perubahan
Perubahan kebijakan diumumkan di halaman ini. Versi sebelumnya tidak disimpan; tanggal berlaku
diperbarui setiap kali ada perubahan.

---

## 2. Syarat dan Ketentuan (`/syarat-ketentuan`)

### 2.1 Layanan
Biro Jasa adalah perangkat lunak berbasis web untuk mencatat berkas jasa biro (perpanjangan STNK,
pergantian plat, mutasi, SIM, dan sejenisnya), mencetak Surat Jalan, dan menghitung pendapatan.
Layanan **tidak** menjamin waktu proses di SAMSAT dan bukan pihak dalam transaksi antara Anda dan
pelanggan Anda.

### 2.2 Akun dan peran
Satu organisasi memiliki satu **owner**. Owner bertanggung jawab atas seluruh aktivitas operator
yang ia buat, termasuk data yang mereka masukkan.

### 2.3 Paket, harga, dan batas pengguna
- **Basic** — Rp 99.000/bulan — **1 pengguna**
- **Pro** — Rp 249.000/bulan — **3 pengguna**
- **Custom** — harga dan jumlah pengguna sesuai kesepakatan, diatur lewat WhatsApp

"Pengguna" adalah owner dan/atau operator yang mengerjakan berkas. **Jika owner ikut mengerjakan
berkas, akun owner memakai satu slot.** Owner yang hanya melihat laporan tidak memakai slot.
Tidak ada masa uji coba gratis dan tidak ada paket gratis.

### 2.4 Pembayaran
1. Owner memilih paket; sistem membuat kode pembayaran.
2. Owner mentransfer jumlah yang tertera ke rekening BCA yang ditampilkan di dalam akun.
3. Owner mengunggah bukti transfer atau menghubungi kami lewat WhatsApp dengan menyertakan kode
   pembayaran.
4. `{promise.core}` `{promise.weekend}` — **rendered by import from `ui-strings.ts`, never
   re-typed.** No other text in this step.
5. **Akses aktif hanya setelah pembayaran berstatus PAID.**

Pembayaran yang ditolak dapat diperbaiki dan dikirim ulang.

### 2.5 Perpanjangan, upgrade, dan downgrade
- **Perpanjangan paket yang sama** ditambahkan ke akhir periode berjalan; sisa hari tidak hilang.
- **Upgrade berlaku setelah bukti transfer diverifikasi, dan batas pengguna bertambah saat itu.
  Sisa hari paket lama tidak dihitung prorata dan tidak dikembalikan.**
- **Downgrade** tidak tersedia selama paket yang lebih tinggi masih aktif. Anda dapat membeli
  paket lebih rendah setelah periode berjalan berakhir, dan memilih operator yang tetap aktif
  sesuai batas paket baru.

### 2.6 Pengembalian dana
Pengembalian dana penuh diberikan bila diminta dalam **7 hari** sejak pembayaran dan **belum ada
satu berkas pun yang dicatat**. Setelah ada berkas tercatat atau setelah 7 hari, pembayaran tidak
dapat dikembalikan; akses tetap berjalan sampai akhir periode yang sudah dibayar. Pengembalian
dana dilakukan melalui transfer bank ke rekening pengirim, paling lambat 7 hari kerja setelah
disetujui.

### 2.7 Kewajiban pengguna
Anda hanya boleh memasukkan data kendaraan dan data pribadi yang Anda berhak proses, dan wajib
memiliki izin dari pemilik data. Anda dilarang menggunakan layanan untuk memalsukan dokumen.

### 2.8 Ketersediaan layanan
Kami menargetkan ketersediaan 99%, tetapi **tidak memberikan jaminan ketersediaan (SLA)**. Layanan
dapat dihentikan sementara untuk pemeliharaan.

### 2.9 Penangguhan dan penghentian
Pelanggaran ketentuan ini atau penyalahgunaan dapat menyebabkan penonaktifan organisasi. Data tetap
disimpan sesuai kebijakan retensi pada Kebijakan Privasi.

### 2.10 Hukum yang berlaku
Ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan secara musyawarah terlebih
dahulu.

---

## Build notes for PM/Developer/QA

- **Identity: render the single line in the header, not the block around it.** Never a street
  address, never an NPWP row, not even an empty one.
- **Canonical phone: 081319535441**, unformatted, in every location; `wa.me` links use
  `6281319535441`.
- §1.4 third bullet and any "data dihapus atas permintaan" wording: **blocked** until
  `scripts/delete-org-data.ts` exists.
- §2.4 step 4 imports `promise.core` + `promise.weekend` (A21). QA checks all three locations
  (locked screen, FAQ, terms) once `/syarat-ketentuan` exists.
- §1.6 backup sentence stays. **Both pages go public only after `scripts/backup.sh` exists and has
  run once.** Local demo is not public, so this gates production, not the demo.
- §1.6 database-level separation: **absent until RLS lands.** When it does, append:
  "Selain itu, data setiap organisasi dipisahkan di tingkat basis data."
- §2.8 contains the only uptime sentence we are allowed to publish: a target, not a promise.
