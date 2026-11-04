# UI Strings — Bahasa Indonesia (Designer, single table)

Source: Designer, Thread 6. Checked against repo at bdaa774.
Rule: build verbatim. Changes need Designer approval in Thread 3.
Spelling: always **SAMSAT**. Never "samas", never "free trial / gratis / uji coba" (except FAQ #2's refusal).
Placeholders in `{braces}` are interpolated. Money always via `formatRupiah()`.

---

## 0. Global

| Key | Where (current) | Indonesian |
|---|---|---|
| meta.title | layout.tsx:8 | Biro Jasa — Platform Manajemen Biro Jasa |
| meta.description | layout.tsx:9 | Kelola operator, berkas, dan laporan keuangan biro jasa Anda dalam satu dashboard. |
| common.genericError | all forms "An error occurred. Please try again." | Terjadi kesalahan. Silakan coba lagi. |
| common.somethingWrong | "Something went wrong. Please try again." | Terjadi kesalahan. Silakan coba lagi. |
| common.badJson | API "Request body must be valid JSON" | Permintaan tidak valid. |
| common.invalidInput | API "Invalid input" | Data yang dikirim tidak valid. |
| common.internal | API "Internal server error" | Terjadi kesalahan di server. Silakan coba lagi. |
| common.notSignedIn | API "Not signed in" | Silakan masuk terlebih dahulu. |
| common.empty | any "-" placeholder for a number | show the real value; `Rp 0` / `0` when there is no data. Never "-". |

## 1. Validation (src/lib/validations.ts)

| Key | Current | Indonesian |
|---|---|---|
| v.emailRequired | Email is required | Email wajib diisi. |
| v.emailInvalid | Invalid email address | Format email tidak valid. |
| v.passwordRequired | Password is required | Password wajib diisi. |
| v.passwordMin | Password must be at least 8 characters | Password minimal 8 karakter. |
| v.passwordBlank | Password must not be blank | Password tidak boleh hanya spasi. |
| v.nameRequired | Name is required | Nama wajib diisi. |
| v.orgRequired | Organization name is required | Nama organisasi wajib diisi. |
| v.tokenRequired | Reset token is required | Tautan reset tidak valid. |
| v.passwordMismatch | Passwords do not match | Konfirmasi password tidak cocok. |
| v.emailTaken | User with this email already exists | Email sudah terdaftar. |

`isActive must be a boolean` is developer-only, never shown in UI: keep English.

## 2. Login (/login)

| Key | Current | Indonesian |
|---|---|---|
| login.title | Login | Masuk |
| login.desc | Sign in to your account | Masuk ke akun Anda. |
| login.email | Email | Email |
| login.password | Password | Password |
| login.submit | Sign In | Masuk |
| login.submitting | Signing in... | Memproses… |
| login.invalid | Invalid email or password | Email atau password salah. |
| login.forgot | Forgot password? | Lupa password? |
| login.noAccount | (new, under button) | Belum punya akun? **Daftar** → /register |
| login.resetDone | (banner after reset) | Password berhasil diubah. Silakan masuk. |

## 3. Register (/register)

| Key | Current | Indonesian |
|---|---|---|
| reg.title | Create Account | Buat Akun |
| reg.desc | **Start your free trial** ← CEO violation | Daftar untuk mulai mengelola biro jasa Anda. |
| reg.name | Full Name | Nama Lengkap |
| reg.email | Email | Email |
| reg.password | Password | Password |
| reg.passwordHelp | (new) | Minimal 8 karakter. |
| reg.org | Organization Name | Nama Biro Jasa |
| reg.orgHelp | (new) | Nama usaha yang akan tampil di dashboard dan dokumen. |
| reg.submit | Create Account | Buat Akun |
| reg.submitting | Creating account... | Membuat akun… |
| reg.failed | Registration failed | Pendaftaran gagal. Silakan coba lagi. |
| reg.success | Account created successfully | Akun berhasil dibuat. |
| reg.slugRetry | Could not allocate an organization slug, please retry | Gagal membuat akun. Silakan coba lagi. |
| reg.haveAccount | (new) | Sudah punya akun? **Masuk** → /login |

## 4. Forgot password (/forgot-password)

| Key | Current | Indonesian |
|---|---|---|
| fp.title | Forgot password | Lupa Password |
| fp.desc | We will send you a link… | Masukkan email Anda. Kami akan mengirim tautan untuk mengatur ulang password. |
| fp.submit | Send reset link | Kirim Tautan |
| fp.submitting | Sending... | Mengirim… |
| fp.sent | If that email is registered, a reset link has been sent. | Jika email terdaftar, tautan reset telah dikirim. |
| fp.back | (link) | Kembali ke Masuk |

`fp.sent` must be identical for known and unknown emails (security, not style).

## 5. Reset password (/reset-password)

| Key | Current | Indonesian |
|---|---|---|
| rp.title | Set a new password | Atur Ulang Password |
| rp.desc | Choose a password of at least 8 characters | Buat password baru minimal 8 karakter. |
| rp.new | (label) | Password Baru |
| rp.confirm | (label) | Konfirmasi Password |
| rp.submit | Set password | Simpan Password |
| rp.submitting | Saving... | Menyimpan… |
| rp.done | Password updated. You can now sign in. | Password berhasil diubah. Silakan masuk. |
| rp.invalid.title | This link has expired | Tautan tidak valid atau sudah kedaluwarsa |
| rp.invalid.desc | Reset links work once and expire after 60 minutes… | Tautan reset hanya bisa dipakai sekali dan berlaku 60 menit. Minta tautan baru dan gunakan email yang paling baru. |
| rp.invalid.cta | Request a new link | Minta Tautan Baru |
| rp.invalid.back | Back to sign in | Kembali ke Masuk |
| rp.invalid.api | This reset link is invalid or has expired | Tautan tidak valid atau sudah kedaluwarsa. |

## 6. Locked screen — no active subscription (A12)

| Key | Indonesian |
|---|---|
| lock.title | Langganan Anda belum aktif |
| lock.body | Pilih paket untuk mulai mencatat berkas dan mengelola operator. Data Anda tetap tersimpan dan bisa diekspor. |
| lock.operatorNote | Operator tidak bisa login sampai langganan aktif. |
| lock.cards | reuse `PricingCards` + existing CTA labels (Pilih Basic / Pilih Pro / Hubungi Kami). No new copy. |
| lock.export | (only if export exists) Ekspor Data |
| op.blocked (operator login attempt) | Akses ditutup karena langganan organisasi belum aktif. Hubungi owner Anda. |

A20/A21: `lock.title`/`lock.body`/`lock.operatorNote` are now the `sub.*` keys in §15 — one screen, one set of strings. The text is unchanged; the keys are not duplicated.

Lapsed and never-paid orgs see the same screen (A12). No "expired on {date}" variant in MVP.

## 7. Checkout disclosure (A13)

| Key | Indonesian |
|---|---|
| co.upgradeNote | Upgrade mulai berlaku setelah bukti transfer diverifikasi, dan batas operator langsung bertambah. Sisa hari paket Basic tidak dihitung prorata. |
| co.renewNote | Perpanjangan dimulai setelah periode aktif Anda berakhir, jadi tidak ada hari yang hilang. |
| co.downgradeRefused | Paket tidak bisa diturunkan selama Pro masih aktif. Pilih Basic setelah periode Pro berakhir. |
| co.pay | Bayar {amount} |
| co.pending | Menunggu konfirmasi pembayaran… |
| co.success | Pembayaran berhasil. Paket {plan} aktif sampai {date}. |
| co.failed | Pembayaran gagal atau dibatalkan. Silakan coba lagi. |

Placement: `co.*Note` directly above the pay button, `text-sm`, `--muted-foreground`, no icon.

A20: there is no gateway, so `co.failed` ("Pembayaran gagal atau dibatalkan") has no trigger and must not be wired — a payment that never arrives stays `UNPAID`, and one that is wrong becomes `REJECTED` with a reason (§15, state D). A20 correction: "mulai berlaku hari ini" was true only while a gateway confirmed payment instantly. With manual verification the upgrade starts at verification, so the sentence moves with it. A16/A20 also mean `co.pending` is a state of the subscribe screen, not a button state.

## 8. Dashboard shell (sidebar.tsx)

| Key | Current | Indonesian |
|---|---|---|
| nav.ownerSubtitle | owner Dashboard | Dashboard Owner |
| nav.operatorSubtitle | operator Dashboard | Dashboard Operator |
| nav.dashboard | Dashboard | Beranda |
| nav.operators | Operators | Operator |
| nav.revenue | Revenue | Pendapatan |
| nav.settings | Settings | Pengaturan |
| nav.files | Files | Berkas |
| nav.transactions | Transactions | Transaksi |
| nav.logout | Logout | Keluar |

Fix while here: role subtitle is built from `role.toLowerCase()` + CSS capitalize. Use the two keys above instead.

## 9. Owner dashboard (/dashboard/owner)

| Key | Current | Indonesian |
|---|---|---|
| own.title | Owner Dashboard | Beranda |
| own.welcome | Welcome, {name} | Selamat datang, {name} |
| own.org | Organization: {org} | Biro jasa: {org} |
| own.plan | (new) | Paket {plan} · aktif sampai {date} |
| own.seats | Active Operators | Slot Operator |
| own.seatsValue | {n} / {limit} | {n} / {limit} terpakai |
| own.revenue | Total Revenue | Pendapatan Bulan Ini |
| own.revenueHelp | (new, small under value) | Pembayaran pelanggan dikurangi biaya SAMSAT. Hanya berkas yang sudah diambil bulan ini yang dihitung. |
| own.activeFiles | Active Files | Berkas Diproses |
| own.revenueByOp | (new, M4/M5) | Pendapatan per Operator |
| own.revenueByOp.empty | (new) | Belum ada berkas yang diambil bulan ini. |

Revenue card shows the current calendar month (WIB). `own.revenueHelp` carries both halves of the claim so the client can check criterion #4 by eye: the calculation, which they can verify against a single file, and the timing, because the figure sums `File.revenue` for files whose `pickedUpAt` falls in that month (Asia/Jakarta). The timing sentence is what stops the card being read as cash received; dropping either half leaves a different misreading open.

## 10. Add operator (operator-form.tsx)

| Key | Current | Indonesian |
|---|---|---|
| addop.title | Add operator | Tambah Operator |
| addop.counter | (new, above form) | Slot operator: {used} / {limit} |
| addop.name | Name | Nama |
| addop.email | Email | Email |
| addop.password | Initial password | Password Awal |
| addop.passwordHelp | At least 8 characters. Share it with the operator… | Minimal 8 karakter. Bagikan ke operator; mereka bisa menggantinya nanti. |
| addop.submit | Create operator | Tambah Operator |
| addop.submitting | Creating... | Menyimpan… |
| addop.success | {name} can now sign in with {email}. Give them… | {name} sudah bisa masuk dengan {email}. Berikan password yang baru Anda buat. |
| addop.failed | Could not create the operator | Operator gagal ditambahkan. |
| addop.limit | Your package has no operator seats left. Upgrade… | Slot operator paket Anda sudah penuh ({used}/{limit}). Upgrade paket atau nonaktifkan operator lain. |
| addop.limitApi | Operator limit reached for your package | Slot operator paket Anda sudah penuh. |
| addop.ownerOnly | Only an organization owner can add operators | Hanya owner yang bisa menambah operator. |
| addop.ownerOnlyEdit | Only an organization owner can change operators | Hanya owner yang bisa mengubah operator. |
| addop.notFound | Operator not found | Operator tidak ditemukan. |
| addop.deactivate | (M3 list) | Nonaktifkan |
| addop.activate | (M3 list) | Aktifkan |
| addop.overLimit | (A14, over-limit org) | Jumlah operator aktif melebihi paket Anda ({n}/{limit}). Nonaktifkan operator sampai sesuai batas. |

`addop.limit` alert: info style, not destructive. Amber text on white is not used (contrast); use `--foreground` text in a `--muted` box.

## 11. Operator dashboard (/dashboard/operator)

| Key | Current | Indonesian |
|---|---|---|
| opd.title | Operator Dashboard | Beranda |
| opd.welcome | Welcome, {name} | Selamat datang, {name} |
| opd.role | Role: {role} | remove — operator knows their role |
| opd.myFiles | My Files | Berkas Saya |
| opd.pending | Pending | Sedang Diproses |
| opd.completed | Completed | Selesai |

## 12. File status + service labels (M3/M4 — needed for criterion #3)

| Enum | Indonesian | Badge |
|---|---|---|
| DRAFT | Draf | neutral (slate) |
| DP_PAID | DP Diterima | neutral (indigo outline) |
| ON_PROGRESS_SAMSAT | Diproses di SAMSAT | indigo |
| COMPLETED_SAMSAT | Selesai di SAMSAT | emerald outline |
| PICKED_UP | Sudah Diambil | emerald solid |
| CANCELED | Dibatalkan | rose |

| Enum | Indonesian |
|---|---|
| STNK | STNK |
| PLAT | Ganti Plat |
| MUTASI | Mutasi |
| SIM_A / SIM_B / SIM_C | SIM A / SIM B / SIM C |

Badges always carry the text label; color is never the only signal (WCAG 1.4.1).
File form labels: see §12b (provisional, drafted from the schema). Empty states: §12a.

### 12a. Empty states (lists)

`common.empty` covers numbers only. Lists use these. Layout: centered in the list area, muted icon (lucide, `aria-hidden`), title `font-medium`, body `text-sm --muted-foreground`, optional button. No illustration.

| Key | Where | Title | Body | Action |
|---|---|---|---|---|
| empty.myFiles | Operator · Berkas Saya | Belum ada berkas | Berkas yang Anda input akan muncul di sini. | Input Berkas (primary) |
| empty.myFiles.filtered | Operator · Berkas Saya, filter active | Tidak ada berkas yang cocok | Ubah atau reset filter untuk melihat berkas lain. | Reset Filter (outline) |
| empty.ownerFiles | Owner · Berkas | Belum ada berkas | Berkas yang diinput operator akan muncul di sini. | — |
| empty.operators | Owner · Operator | Belum ada operator | Tambahkan operator agar mereka bisa menginput berkas. Jika Anda mengerjakan sendiri, akun owner sudah cukup. | Tambah Operator (primary) |
| empty.operators.full | Owner · Operator, no seat left and none active | Belum ada operator | Slot operator paket Anda sedang dipakai akun owner. Upgrade paket untuk menambah operator. | — |
| empty.revenueByOp | Owner · Pendapatan per Operator | Belum ada pendapatan bulan ini | Pendapatan dihitung saat berkas berstatus Sudah Diambil. | — |

Rules: the action button only renders if its route exists (A16 no dead links). `Input Berkas` and the owner Berkas list arrive with M3; until then the operator list shows the empty state without a button.

### 12b. File form (M3) — labels from the current schema, provisional

Draft taken from `prisma/schema.prisma` (`model File`) so M3 does not wait on a round trip. Developer: if the M3 field list differs, the difference is additive — send it and the extra labels come back same day. Grouping and order below are the design; do not reorder.

**Section: Data Pelanggan**

| Key | Label | Helper / error |
|---|---|---|
| file.customerName | Nama Pelanggan | error: Nama pelanggan wajib diisi. |
| file.customerKtp | NIK KTP | helper: 16 angka, sesuai KTP. error: NIK harus 16 angka. |
| file.vehicleNumber | Nomor Kendaraan | helper: Contoh: B 1234 XYZ. error: Nomor kendaraan wajib diisi. |
| file.ownershipType | Jenis Kepemilikan | select (enum `OwnershipType`, A17/A23): `PERORANGAN` → Perorangan, `BADAN_USAHA` → Badan Usaha, `PEMERINTAH` → Pemerintah, `YAYASAN` → Yayasan. Default Perorangan. Labels from `ownership.*` (§17). |
| file.serviceType | Jenis Layanan | options from §12 (STNK, Ganti Plat, Mutasi, SIM A, SIM B, SIM C) |
| file.notes | Catatan | placeholder: Opsional |

**Section: Biaya**

| Key | Label | Helper / error |
|---|---|---|
| file.estimatedPrice | Estimasi Biaya | helper: Angka saja, tanpa titik. Contoh: 1500000 |
| file.dpAmount | DP Diterima | helper: Biasanya 50% dari estimasi. Isi 0 jika belum ada DP. |
| file.finalPrice | Total Dibayar Pelanggan | helper: Diisi saat berkas selesai. |
| file.samsatPayment | Biaya SAMSAT | helper: Biaya yang dibayarkan ke SAMSAT. |
| file.serviceFee | Jasa Anda | read-only, computed: Total Dibayar Pelanggan − Biaya SAMSAT. Never editable (A1). |
| file.moneyError | — | error: Masukkan angka tanpa titik atau koma. |

**Status and dates**

| Key | Label | Note |
|---|---|---|
| file.status | Status | select, values from §12; transitions per TDD |
| file.pickedUpAt | Diambil pada | read-only, set automatically when status becomes Sudah Diambil (A16). Never a form field. |
| file.createdAt | Diinput pada | read-only |

**Actions**

| Key | Indonesian |
|---|---|
| file.submit | Simpan Berkas |
| file.update | Simpan Perubahan |
| file.submitting | Menyimpan… |
| file.cancel | Batal |
| file.saved | Berkas berhasil disimpan. |
| file.updated | Perubahan berkas disimpan. |
| file.failed | Berkas gagal disimpan. Silakan coba lagi. |
| file.confirmLeave | Isian belum disimpan. Yakin ingin meninggalkan halaman ini? |
| file.statusChanged | Status berkas diubah menjadi {status}. |
| file.pickupGuard | Total dibayar pelanggan harus diisi dan tidak boleh lebih kecil dari biaya SAMSAT. |
| file.terminalNote | Berkas yang sudah diambil atau dibatalkan tidak bisa diubah statusnya lagi. |
| file.cancelStatus | Batalkan berkas |
| file.cancelConfirm | Batalkan berkas ini? Berkas yang dibatalkan tidak dihitung dalam pendapatan dan tidak bisa dikembalikan ke status sebelumnya. |
| file.cancelConfirmYes | Ya, Batalkan |
| file.cancelConfirmNo | Tidak |
| file.cancelled | Berkas dibatalkan. |

**Sensitive-data display rule**

`customerKtp` is KTP data. In any list or table it renders masked: `••••••••••••` + last 4 digits. The full value appears on the detail/edit screen the operator is working on, and nowhere else in the UI.

Exceptions, per A17 — these are not oversights:
- **Owner export contains the full KTP.** The data is the owner's, and handing it back to them is what export is for (A12). Masking it there would break the export's only purpose. Owner-only; operators have no export path at all.
- **Logs never contain it.** Not masked — absent.
- **Surat Jalan prints the full NIK (CEO ruling, A20/A23).** It goes to the customer, whose own KTP it is.

**No delete (§12c)**

There is no delete action on a file, in any screen. A file is cancelled through its status (`CANCELED`), which keeps the row and its history. Two reasons: deleting a row destroys the revenue attached to it (BUG-12 from the UI side), and a cancelled job that visibly exists is information the owner needs when a customer comes back.

Wording matters here. The action is "Batalkan", never "Hapus". A user who wants to remove a mistake will look for "Hapus" and should not find it.

### 12e. Print — Surat Jalan (A26, M4)

| Key | Indonesian |
|---|---|
| file.print | Cetak Surat Jalan |
| file.printCancelled | Berkas yang sudah dibatalkan tidak punya Surat Jalan untuk dicetak. |
| own.revenueByOpCount | {n} berkas |

**1. `file.print`** — one key, both detail screens. `FileForm` renders it, so operator and owner get the same control in the same place without a second implementation.

- Placement: the action row at the bottom of the form, beside the primary action, last of the three — `[Simpan] [Kembali] [Cetak Surat Jalan]`. Same row because it acts on the record the form is showing; last because a print button next to save is a misclick that produces a document instead of an error message.
- Desktop: `ml-auto` puts it at the far right, away from Simpan. Mobile: it wraps under the other two rather than shrinking the labels.
- Outline variant, `Printer` icon (`aria-hidden`), opens `/api/files/{id}/surat-jalan` in a new tab with `rel="noopener"`. The route sends `inline`, so the browser previews the PDF and the user prints from there — we never call `window.print()` on the form.
- **Not rendered when status is `CANCELED`.** The action is absent, not disabled; a greyed button invites a click that can only fail. The 409 from `file.printCancelled` covers a stale tab or a bookmarked URL, which is the only way to reach that state.
- Known limit, accepted for M4: if the form has unsaved edits, the PDF shows the stored version, not what is on screen. Disabling print while dirty would block a legitimate request (people print right after opening a record, before editing) and a warning line would be a fourth string for a case the record's own dates already make visible. Revisit if QA sees confusion in testing.

**2. `own.revenueByOpCount`** — `OperatorTotal.files`, the count that exists and is currently unshown. Placement: Owner · Beranda, the per-operator revenue list. Each row gets a right-aligned second line under the rupiah amount, `text-xs`, `--muted-foreground`. The money stays the headline (criterion #4); the count answers "how many jobs produced that number", which is the question the owner asks next.

- A count is never formatted as money: no `formatRupiah`, no "Rp", no thousands separator beyond `Intl.NumberFormat('id-ID')` default for integers. `3 berkas`, `1 berkas` — Indonesian does not pluralise, so there is no second form to get wrong.
- The total row keeps its current content. `RevenueReport.total.files` exists, but adding a second count there invites the owner to sum the rows by hand and find the unpriced fetched files missing (A26). One count, per operator, no total.

### 12d. Seatless owner — read-only (A24)

An owner without an active `Operator` row can read everything and change nothing. The seat is the permission, not the role, so this state is normal operation (the owner handed the seat to staff), not an error and not a degraded account.

**One banner, two placements.** Same key, same words, rendered above the list on Owner · Berkas and above the form on Ubah Berkas:

| Key | Indonesian |
|---|---|
| seat.readOnly | Anda tidak memegang slot operator, jadi berkas hanya bisa dilihat. Aktifkan slot Anda untuk mulai mengubah berkas lagi — jika semua slot terpakai, nonaktifkan operator lain lebih dulu. |
| seat.reactivate | Aktifkan Slot Saya |
| seat.reactivateOk | Slot Anda aktif. Anda bisa mengubah berkas lagi. |
| seat.reactivateFull | Semua slot sedang terpakai. Nonaktifkan operator lain lebih dulu, lalu aktifkan slot Anda. |

Rules:
- **Persistent, not a toast.** This is a standing state that survives reload; a notification would vanish and leave the owner wondering why Ubah is gone.
- **The action is absent, not disabled.** On Ubah Berkas a greyed "Simpan" reads as a broken page; no button plus the banner reads as a cause. The fields stay readable — hiding the data would punish the owner for a seat decision they made deliberately.
- **Row action "Ubah" is not rendered** in the owner file list while seatless. Tapping into a record the user cannot save is a dead end.
- **`seat.reactivate` sits in the banner**, never in a toast or a modal. One click, and `seat.reactivateFull` explains the one case where it fails.
- Style: `--muted` box, `--foreground` text, `aria-live="polite"` so a failed reactivation is announced. Not `--destructive`: nothing is broken.
- **The 403 body and the banner are the same string on purpose** (`UI.seat.readOnly`). 184 characters in a toast is unreadable for four seconds, so the client renders a 403 from `POST`/`PATCH /api/files` as the banner state, not as a notification. Same reason the banner exists: a standing cause needs a standing message.
- **Distinct from `addop.overLimit`** (organization over its package limit after a downgrade) and from the locked screen (no active subscription). Three different causes, three different sentences; collapsing them would send the owner to the wrong fix.

For the same reason the filtered-empty state says "Reset Filter", not "Hapus Filter": the word "Hapus" appears nowhere in the product, so it cannot train a user to expect a delete that does not exist.

Cancel is confirmed (§12b, `file.cancelConfirm`) because `CANCELED` is terminal (A17). The dialog states that consequence instead of asking "are you sure".

**Table headers (owner + operator file lists)**

| Key | Indonesian |
|---|---|
| th.customer | Pelanggan |
| th.vehicle | Kendaraan |
| th.service | Layanan |
| th.status | Status |
| th.revenue | Jasa |
| th.operator | Operator |
| th.date | Tanggal |
| th.actions | — (single icon button, `aria-label`: Ubah. **No delete. Files are cancelled, not deleted** — see §12c) |


## 13. Landing (closes M7)

| Key | Indonesian |
|---|---|
| feat3.title | Laporan Keuangan Otomatis |
| feat3.body | Pendapatan dihitung otomatis: pembayaran pelanggan dikurangi biaya SAMSAT, dan sisanya adalah jasa Anda. |
| faq.heading | Pertanyaan yang Sering Diajukan |
| faq3.q | Berapa operator yang bisa saya tambahkan? |
| faq3.a | Basic mendukung 1 operator dan Pro 3 operator. Jika Anda ikut mengerjakan berkas, akun owner memakai satu slot. Butuh lebih banyak? Ajukan paket Custom lewat Hubungi Kami. |
| pricing.seatNote | Slot operator sudah termasuk akun owner jika Anda ikut mengerjakan berkas. |
| feat4.title | Pembayaran Transfer Bank |
| feat4.body | Bayar lewat transfer bank dan unggah bukti transfer dari dashboard. {promise.core} |
| faq1.q | Berapa lama proses aktivasi setelah pembayaran? |
| faq1.a | {promise.core} {promise.weekend} |
| faq2.q | Apakah ada masa uji coba gratis? |
| faq2.a | Tidak. Paket aktif setelah pembayaran pertama diverifikasi. |

feat4 ends with `promise.core` itself rather than its own wording, so the landing page does not grow a fourth phrasing of the promise. feat4 replaces the old "Pembayaran Online … lewat Midtrans" line: there is no gateway (A20), so "otomatis" would be a false claim. faq2's answer no longer says "langsung setelah pembayaran" for the same reason — activation is now a human verification step.

Order: feat3 goes back in position 3; FAQ #3 goes back in position 3. Features = 6, FAQ = 6.
`pricing.seatNote` sits under the caption "Harga dalam Rupiah. Ditagih bulanan.", same style.
Tests in src/lib/m1.test.ts that assert 5 features / 5 FAQ items must flip to 6 in the same commit.

---

# Part 2 — Manual payment (A20/A21)

## 14. The promise — one string, three places

Two keys. Everything that promises a verification time renders these, and nothing else. Not paraphrased, not shortened, not reordered: QA checks the three placements byte for byte, and the only way that survives an edit is one key per sentence.

| Key | Indonesian |
|---|---|
| promise.core | Verifikasi pembayaran maksimal 1 hari kerja. |
| promise.weekend | Pembayaran yang dikirim pada Sabtu, Minggu, atau hari libur nasional diproses paling lambat pada akhir hari kerja berikutnya. Contoh: transfer pada Jumat malam diverifikasi paling lambat Senin. |

Counted in working days, Monday–Friday, excluding national holidays. **The app does not compute this** (A21): no holiday calendar, no working-day arithmetic anywhere in code. The sentence states the rule; the verification queue is what keeps it.

Where they appear:
1. **Locked/subscribe screen** — directly under the heading, before the plan cards.
2. **Landing FAQ #1** — `{promise.core} {promise.weekend}`, in that order, one paragraph.
3. **`/syarat-ketentuan`** — §2.4 step 4 of `docs/legal-id.md` (CEO v2) is `{promise.core} {promise.weekend}` and nothing else, rendered by import. Same bytes as the other two locations by construction.

Why the Monday example is in the sentence: "maksimal 1 hari kerja" is ambiguous for a Friday-night transfer, and the customer will read it as "Saturday". The example removes the reading without adding a second promise. There is exactly one promise in the product — no "biasanya lebih cepat", no "segera", no percentage. If verification starts beating the promise routinely, the promise is still the promise.

## 15. Subscribe screen (`/dashboard/subscription`)

**One screen, not two.** The locked screen and the payment screen are the same route: an owner with no active plan lands here, and the screen shows whichever of the states below applies. Two screens showing the same cards is how a user ends up on the one that cannot help them.

Reachable while locked. It is the only screen a locked owner can use; `/dashboard` stays closed (A12).

| Key | Indonesian |
|---|---|
| sub.title | Langganan Anda belum aktif |
| sub.body | Pilih paket untuk mulai mencatat berkas dan mengelola operator. Data Anda tetap tersimpan dan bisa diekspor. |
| sub.operatorNote | Operator tidak bisa login sampai langganan aktif. |
| sub.planHeading | Pilih Paket |
| sub.cards | reuse `PricingCards` (prices from `src/lib/plans.ts`) |
| sub.export | Ekspor Data |

State A — no payment yet: heading + `promise.core`/`promise.weekend` + cards. Basic/Pro buttons create the payment row and move to state B. Custom keeps "Hubungi Kami" → WhatsApp.

State B — `UNPAID`:

| Key | Indonesian |
|---|---|
| pay.title | Selesaikan Pembayaran |
| pay.codeLabel | Kode Pembayaran |
| pay.codeHelp | Cantumkan kode ini di berita transfer agar pesanan Anda mudah ditemukan. |
| pay.amountLabel | Jumlah |
| pay.bankLabel | Transfer ke |
| pay.accountName | a.n. {name} |
| pay.copy | Salin |
| pay.copied | Nomor rekening disalin. |
| pay.steps | 1. Transfer sesuai jumlah di atas. 2. Cantumkan kode pembayaran di berita transfer. 3. Unggah bukti transfer di bawah ini. |
| pay.uploadCta | Unggah Bukti Transfer |
| pay.uploadHint | JPG, PNG, atau PDF. Maksimal 5 MB. |
| pay.waCta | Konfirmasi lewat WhatsApp |
| pay.waHelp | Sudah transfer? Kirim bukti lewat WhatsApp sebagai alternatif unggah. |
| pay.bankMissing | Nomor rekening belum tersedia. Hubungi kami lewat WhatsApp untuk menyelesaikan pembayaran. |
| pay.changePlan | Ganti paket |

`pay.bankMissing` is the missing-env state (A20): WhatsApp only, never a blank account field, and the server logs it. `pay.changePlan` returns to state A and replaces the `UNPAID` row rather than stacking a second one.

State C — `WAITING_VERIFICATION`:

| Key | Indonesian |
|---|---|
| verify.waitTitle | Bukti transfer sudah kami terima |
| verify.waitBody | Kami akan memverifikasi pembayaran Anda. Bila ada yang perlu dikonfirmasi, kami menghubungi Anda lewat WhatsApp. |
| verify.waitPromise | {promise.core} {promise.weekend} (same keys, same order as everywhere else) |
| verify.waitCode | Kode pembayaran: {code} |
| verify.waitLocked | Selama menunggu, dashboard dan data berkas belum bisa dibuka. |

`verify.waitLocked` is the honest one: only `PAID` grants access (A20), so an owner who has paid and is waiting must be told they are still locked rather than left clicking a dashboard that refuses them.

State D — `REJECTED` (A20: same row, re-upload, no new order):

| Key | Indonesian |
|---|---|
| verify.rejTitle | Bukti transfer belum bisa kami terima |
| verify.rejReasonLabel | Alasan |
| verify.rejBody | Periksa kembali bukti transfer Anda, lalu unggah ulang. Anda tidak perlu membuat pesanan baru. |
| verify.rejReupload | Unggah Ulang Bukti |
| verify.rejWa | Tanya lewat WhatsApp |
| verify.rejCode | Kode pembayaran tetap {code} |

The rejection reason comes from the admin's own words (§16) and is shown verbatim. A rejection with no explanation reads as a lost payment, and the customer's next move is a phone call.

Upload feedback:

| Key | Indonesian |
|---|---|
| up.sending | Mengunggah… |
| up.done | Bukti transfer berhasil diunggah. |
| up.tooBig | Ukuran file maksimal 5 MB. |
| up.badType | Format file harus JPG, PNG, atau PDF. |
| up.unreadable | File tidak bisa dibaca. Coba unggah ulang. |
| up.failed | Bukti transfer gagal diunggah. Silakan coba lagi. |

`up.badType` and `up.unreadable` are separate on purpose: the first is the user's mistake, the second is ours (magic-byte check rejected a file the picker allowed). One message for both would send the user to re-pick a file that is already fine.

State E — `PAID`: redirect to `/dashboard` with `co.success`.

## 16. Super Admin console (M2)

| Key | Indonesian |
|---|---|
| adm.navQueue | Verifikasi Pembayaran |
| adm.navOrgs | Organisasi |
| adm.queueTitle | Verifikasi Pembayaran |
| adm.queueSort | Terlama di atas |
| adm.queueEmpty | Tidak ada pembayaran yang menunggu verifikasi. |
| adm.colCode | Kode |
| adm.colOrg | Organisasi |
| adm.colOwner | Pemilik |
| adm.colPlan | Paket |
| adm.colAmount | Jumlah |
| adm.colSent | Dikirim (WIB) |
| adm.colAge | Umur |
| adm.colAction | — (`aria-label`: Periksa) |
| adm.ageToday | Hari ini |
| adm.ageYesterday | 1 hari lalu |
| adm.ageDays | {n} hari lalu |

Order: oldest `WAITING_VERIFICATION` first (A21). Age is plain elapsed time, `Intl.RelativeTimeFormat('id')` style — **no working-day counter, no badge that colours red at the promise deadline**; the promise is a human commitment and the queue is a reminder, not a timer. `adm.queueSort` is stated on screen so nobody assumes the list is alphabetical by customer.

Admin detail + actions:

| Key | Indonesian |
|---|---|
| adm.detailTitle | Periksa Pembayaran {code} |
| adm.receipt | Bukti Transfer |
| adm.receiptMissing | Bukti transfer tidak diunggah. Konfirmasi lewat WhatsApp. |
| adm.verify | Verifikasi |
| adm.reject | Tolak |
| adm.verifyConfirm | Verifikasi pembayaran ini? Paket {plan} aktif sampai {date}. |
| adm.rejectTitle | Tolak Pembayaran |
| adm.rejectReasonLabel | Alasan penolakan (dilihat oleh pemilik) |
| adm.rejectReasonRequired | Alasan penolakan wajib diisi. |
| adm.rejectSend | Kirim Penolakan |
| adm.verifiedOk | Pembayaran diverifikasi. Paket aktif sampai {date}. |
| adm.rejectedOk | Pembayaran ditolak. Pemilik bisa mengunggah ulang. |
| adm.alreadyDone | Pembayaran ini sudah diproses. |
| adm.staleQueue | Daftar sudah diperbarui. Pembayaran ini tidak lagi menunggu verifikasi. |

Rejection reasons offered as one-tap options (free text stays available):

| Key | Indonesian |
|---|---|
| rr.unreadable | Bukti tidak terbaca |
| rr.amountMismatch | Jumlah tidak sesuai |
| rr.notTransfer | Bukan bukti transfer |
| rr.other | Lainnya |

`adm.rejectReasonLabel` says "dilihat oleh pemilik" because the reason is customer-facing copy written by an admin. Without that note, admins write "cek mutasi" and the customer reads it as an accusation.

Admin errors and org controls:

| Key | Indonesian |
|---|---|
| adm.errReceipt | Bukti transfer tidak bisa dibuka. |
| adm.errGeneric | Tindakan gagal. Silakan coba lagi. |
| adm.errForbidden | Halaman ini hanya untuk admin platform. |
| adm.orgTitle | Organisasi |
| adm.orgLimit | Batas Operator |
| adm.orgLimitSave | Simpan Batas |
| adm.orgLimitSaved | Batas operator disimpan. |
| adm.orgLimitRequired | Batas operator wajib berupa angka 1 atau lebih. |
| adm.orgDeactivate | Nonaktifkan |
| adm.orgActivate | Aktifkan |
| adm.orgDeactivateConfirm | Nonaktifkan organisasi ini? Owner melihat layar langganan dan operator tidak bisa masuk. Data tidak dihapus. |
| adm.orgActivateConfirm | Aktifkan kembali organisasi ini? Akses mengikuti paket yang masih berlaku. |
| adm.orgInactive | Nonaktif |

`adm.orgDeactivateConfirm` names what the owner will see, because "nonaktifkan" alone sounds like deletion and an admin who is unsure will simply not press it — leaving a non-paying org with access.

**What the admin console never shows:** files, KTP, transactions, revenue (A20, structural). No string exists for them here, which is the point.

## 17. `ownershipType` — the four surfaces

The enum has four values (A17, closed by A23). Four places render it, and all four take the same `ownership.*` label:

| Surface | Rendering |
|---|---|
| File form select (`file.ownershipType`) | Perorangan / Badan Usaha / Pemerintah / Yayasan, default Perorangan |
| File detail view | "Jenis Kepemilikan: {ownership.*}", e.g. "Jenis Kepemilikan: Yayasan" |
| File list filter | Semua / Perorangan / Badan Usaha / Pemerintah / Yayasan |
| Export (PDF/Excel) column | header "Jenis Kepemilikan", value = `ownership.*` label (never the raw enum) |

| Key | Indonesian |
|---|---|
| ownership.PERORANGAN | Perorangan |
| ownership.BADAN_USAHA | Badan Usaha |
| ownership.PEMERINTAH | Pemerintah |
| ownership.YAYASAN | Yayasan |
| th.ownership | Jenis Kepemilikan |
| filter.all | Semua |

Order is the same everywhere: enum order, most common first. Filter puts "Semua" first because it is the reset state. "Pemerintah" is the CEO's term — not "Instansi", which must not appear as a label anywhere.

## 18. Legal pages — `/kebijakan-privasi`, `/syarat-ketentuan` (A24, M5)

Source: `docs/legal-id.md` (CEO v2). **Placed verbatim.** Designer specifies layout only; no word in that file is edited by Designer or Developer.

| Key | Indonesian |
|---|---|
| legal.privacyTitle | Kebijakan Privasi |
| legal.termsTitle | Syarat & Ketentuan |
| legal.updated | Berlaku sejak {date} |
| footer.privacy | Kebijakan Privasi |
| footer.terms | Syarat & Ketentuan |
| reg.legalAgree | Dengan mendaftar, Anda menyetujui {Syarat & Ketentuan} dan {Kebijakan Privasi}. |

Layout:
- Public pages, landing header + footer, single column `max-w-prose`, body `text-base`, line height 1.7. Headings follow the file's numbering (1.1, 2.4 …) so a support reply can cite "lihat 2.4".
- Identity line at the top of both pages, exactly this and nothing else:

  > Zidan Ferdiansyah · Kab. Bekasi, Jawa Barat · zidanferdi13@gmail.com · WhatsApp 081319535441

  Only block-quoted text in `legal-id.md` is rendered copy. Every unquoted sentence in that file — the "no street address, no NPWP" rules, the canonical-format note, the build notes — is an instruction to us and never reaches the page. Pasting a section wholesale would publish those instructions to the public, which is the one way this placement goes wrong.
- §2.4 is a numbered list; step 4 = `{promise.core} {promise.weekend}` by import.
- **[BLOCKED] items are not rendered** — not greyed, not "segera hadir". Absent until their script exists.
- `legal.updated` comes from one constant per page; the file has no version archive (§1.7), so the date is the only change signal.
- `reg.legalAgree`: under the register button, `text-sm --muted-foreground`, both links open in a new tab so the half-filled form survives. Statement, not a checkbox; the page already states agreement on submit.
- Footer links render only once the pages ship (A16 no dead links). Both pages go public only after `scripts/backup.sh` has run once (legal-id.md build notes).
