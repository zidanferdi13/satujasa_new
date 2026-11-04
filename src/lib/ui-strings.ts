/**
 * Indonesian UI copy. Source: docs/ui-strings-id.md (Designer), plus the two display rules A16
 * states verbatim (`own.seatsCustom`, `notFound`). Keys mirror the doc. Build verbatim; changes
 * need Designer approval through the PM. ui-strings.test.ts fails if any string here is not
 * found word for word in those docs. Money always goes through formatRupiah().
 */
export const UI = {
  meta: {
    title: "Biro Jasa — Platform Manajemen Biro Jasa",
    description: "Kelola operator, berkas, dan laporan keuangan biro jasa Anda dalam satu dashboard.",
  },

  common: {
    genericError: "Terjadi kesalahan. Silakan coba lagi.",
    badJson: "Permintaan tidak valid.",
    invalidInput: "Data yang dikirim tidak valid.",
    internal: "Terjadi kesalahan di server. Silakan coba lagi.",
    notSignedIn: "Silakan masuk terlebih dahulu.",
  },

  v: {
    emailRequired: "Email wajib diisi.",
    emailInvalid: "Format email tidak valid.",
    passwordRequired: "Password wajib diisi.",
    passwordMin: "Password minimal 8 karakter.",
    passwordBlank: "Password tidak boleh hanya spasi.",
    nameRequired: "Nama wajib diisi.",
    orgRequired: "Nama organisasi wajib diisi.",
    tokenRequired: "Tautan reset tidak valid.",
    passwordMismatch: "Konfirmasi password tidak cocok.",
    emailTaken: "Email sudah terdaftar.",
  },

  login: {
    title: "Masuk",
    desc: "Masuk ke akun Anda.",
    email: "Email",
    password: "Password",
    submit: "Masuk",
    submitting: "Memproses…",
    invalid: "Email atau password salah.",
    forgot: "Lupa password?",
    noAccount: "Belum punya akun?",
    noAccountLink: "Daftar",
    resetDone: "Password berhasil diubah. Silakan masuk.",
  },

  reg: {
    title: "Buat Akun",
    desc: "Daftar untuk mulai mengelola biro jasa Anda.",
    name: "Nama Lengkap",
    email: "Email",
    password: "Password",
    passwordHelp: "Minimal 8 karakter.",
    org: "Nama Biro Jasa",
    orgHelp: "Nama usaha yang akan tampil di dashboard dan dokumen.",
    submit: "Buat Akun",
    submitting: "Membuat akun…",
    failed: "Pendaftaran gagal. Silakan coba lagi.",
    success: "Akun berhasil dibuat.",
    slugRetry: "Gagal membuat akun. Silakan coba lagi.",
    haveAccount: "Sudah punya akun?",
    haveAccountLink: "Masuk",
    // §18: statement, not a checkbox. The braces are link slots, filled by the page.
    legalAgree:
      "Dengan mendaftar, Anda menyetujui {Syarat & Ketentuan} dan {Kebijakan Privasi}.",
  },

  fp: {
    title: "Lupa Password",
    desc: "Masukkan email Anda. Kami akan mengirim tautan untuk mengatur ulang password.",
    submit: "Kirim Tautan",
    submitting: "Mengirim…",
    sent: "Jika email terdaftar, tautan reset telah dikirim.",
    back: "Kembali ke Masuk",
  },

  rp: {
    title: "Atur Ulang Password",
    desc: "Buat password baru minimal 8 karakter.",
    new: "Password Baru",
    confirm: "Konfirmasi Password",
    submit: "Simpan Password",
    submitting: "Menyimpan…",
    done: "Password berhasil diubah. Silakan masuk.",
    invalidTitle: "Tautan tidak valid atau sudah kedaluwarsa",
    invalidDesc:
      "Tautan reset hanya bisa dipakai sekali dan berlaku 60 menit. Minta tautan baru dan gunakan email yang paling baru.",
    invalidCta: "Minta Tautan Baru",
    invalidBack: "Kembali ke Masuk",
    invalidApi: "Tautan tidak valid atau sudah kedaluwarsa.",
  },

  // §15: the locked screen and the subscribe screen are one route, so one set of keys (A20/A21).
  sub: {
    title: "Langganan Anda belum aktif",
    body: "Pilih paket untuk mulai mencatat berkas dan mengelola operator. Data Anda tetap tersimpan dan bisa diekspor.",
    operatorNote: "Operator tidak bisa login sampai langganan aktif.",
    planHeading: "Pilih Paket",
    export: "Ekspor Data",
  },

  // §18 (A24): legal pages. Titles and links only — the body is docs/legal-id.md, placed verbatim
  // through src/lib/legal-content.ts, and never edited here.
  legal: {
    privacyTitle: "Kebijakan Privasi",
    termsTitle: "Syarat & Ketentuan",
    updated: (date: string) => `Berlaku sejak ${date}`,
  },

  footer: {
    privacy: "Kebijakan Privasi",
    terms: "Syarat & Ketentuan",
  },

  // §14 / A21: one promise, two sentences. Every placement renders these keys; nothing retypes them.
  promise: {
    core: "Verifikasi pembayaran maksimal 1 hari kerja.",
    weekend:
      "Pembayaran yang dikirim pada Sabtu, Minggu, atau hari libur nasional diproses paling lambat pada akhir hari kerja berikutnya. Contoh: transfer pada Jumat malam diverifikasi paling lambat Senin.",
  },

  op: {
    blocked: "Akses ditutup karena langganan organisasi belum aktif. Hubungi owner Anda.",
  },

  co: {
    upgradeNote:
      "Upgrade mulai berlaku setelah bukti transfer diverifikasi, dan batas operator langsung bertambah. Sisa hari paket Basic tidak dihitung prorata.",
    renewNote: "Perpanjangan dimulai setelah periode aktif Anda berakhir, jadi tidak ada hari yang hilang.",
    downgradeRefused:
      "Paket tidak bisa diturunkan selama Pro masih aktif. Pilih Basic setelah periode Pro berakhir.",
    pay: (amount: string) => `Bayar ${amount}`,
    pending: "Menunggu konfirmasi pembayaran…",
    success: (plan: string, date: string) => `Pembayaran berhasil. Paket ${plan} aktif sampai ${date}.`,
    failed: "Pembayaran gagal atau dibatalkan. Silakan coba lagi.",
  },

  // §12d / A24: the seat is the permission. Same banner on the owner list and the Ubah screen.
  seat: {
    readOnly:
      "Anda tidak memegang slot operator, jadi berkas hanya bisa dilihat. Aktifkan slot Anda untuk mulai mengubah berkas lagi — jika semua slot terpakai, nonaktifkan operator lain lebih dulu.",
    reactivate: "Aktifkan Slot Saya",
    reactivateOk: "Slot Anda aktif. Anda bisa mengubah berkas lagi.",
    reactivateFull: "Semua slot sedang terpakai. Nonaktifkan operator lain lebih dulu, lalu aktifkan slot Anda.",
  },

  // §15 state B: the manual-transfer instructions (A20). Bank values come from env, never copied here.
  pay: {
    title: "Selesaikan Pembayaran",
    codeLabel: "Kode Pembayaran",
    codeHelp: "Cantumkan kode ini di berita transfer agar pesanan Anda mudah ditemukan.",
    amountLabel: "Jumlah",
    bankLabel: "Transfer ke",
    accountName: (name: string) => `a.n. ${name}`,
    copy: "Salin",
    copied: "Nomor rekening disalin.",
    steps:
      "1. Transfer sesuai jumlah di atas. 2. Cantumkan kode pembayaran di berita transfer. 3. Unggah bukti transfer di bawah ini.",
    uploadCta: "Unggah Bukti Transfer",
    uploadHint: "JPG, PNG, atau PDF. Maksimal 5 MB.",
    waCta: "Konfirmasi lewat WhatsApp",
    waHelp: "Sudah transfer? Kirim bukti lewat WhatsApp sebagai alternatif unggah.",
    bankMissing:
      "Nomor rekening belum tersedia. Hubungi kami lewat WhatsApp untuk menyelesaikan pembayaran.",
    changePlan: "Ganti paket",
  },

  // §15 states C and D.
  verify: {
    waitTitle: "Bukti transfer sudah kami terima",
    waitBody:
      "Kami akan memverifikasi pembayaran Anda. Bila ada yang perlu dikonfirmasi, kami menghubungi Anda lewat WhatsApp.",
    waitCode: (code: string) => `Kode pembayaran: ${code}`,
    waitLocked: "Selama menunggu, dashboard dan data berkas belum bisa dibuka.",
    rejTitle: "Bukti transfer belum bisa kami terima",
    rejReasonLabel: "Alasan",
    rejBody:
      "Periksa kembali bukti transfer Anda, lalu unggah ulang. Anda tidak perlu membuat pesanan baru.",
    rejReupload: "Unggah Ulang Bukti",
    rejWa: "Tanya lewat WhatsApp",
    rejCode: (code: string) => `Kode pembayaran tetap ${code}`,
  },

  // §15 upload feedback. tooBig/badType are the user's mistake; unreadable is ours (magic bytes).
  up: {
    sending: "Mengunggah…",
    done: "Bukti transfer berhasil diunggah.",
    tooBig: "Ukuran file maksimal 5 MB.",
    badType: "Format file harus JPG, PNG, atau PDF.",
    unreadable: "File tidak bisa dibaca. Coba unggah ulang.",
    failed: "Bukti transfer gagal diunggah. Silakan coba lagi.",
  },

  // §16 Super Admin console (A20). No key here names a file, a KTP or a revenue figure.
  adm: {
    navQueue: "Verifikasi Pembayaran",
    navOrgs: "Organisasi",
    queueTitle: "Verifikasi Pembayaran",
    queueSort: "Terlama di atas",
    queueEmpty: "Tidak ada pembayaran yang menunggu verifikasi.",
    colCode: "Kode",
    colOrg: "Organisasi",
    colOwner: "Pemilik",
    colPlan: "Paket",
    colAmount: "Jumlah",
    colSent: "Dikirim (WIB)",
    colAge: "Umur",
    action: "Periksa",
    ageToday: "Hari ini",
    ageYesterday: "1 hari lalu",
    ageDays: (n: string) => `${n} hari lalu`,
    detailTitle: (code: string) => `Periksa Pembayaran ${code}`,
    receipt: "Bukti Transfer",
    receiptMissing: "Bukti transfer tidak diunggah. Konfirmasi lewat WhatsApp.",
    verify: "Verifikasi",
    reject: "Tolak",
    verifyConfirm: (plan: string, date: string) =>
      `Verifikasi pembayaran ini? Paket ${plan} aktif sampai ${date}.`,
    rejectTitle: "Tolak Pembayaran",
    rejectReasonLabel: "Alasan penolakan (dilihat oleh pemilik)",
    rejectReasonRequired: "Alasan penolakan wajib diisi.",
    rejectSend: "Kirim Penolakan",
    verifiedOk: (date: string) => `Pembayaran diverifikasi. Paket aktif sampai ${date}.`,
    rejectedOk: "Pembayaran ditolak. Pemilik bisa mengunggah ulang.",
    alreadyDone: "Pembayaran ini sudah diproses.",
    staleQueue: "Daftar sudah diperbarui. Pembayaran ini tidak lagi menunggu verifikasi.",
    errReceipt: "Bukti transfer tidak bisa dibuka.",
    errGeneric: "Tindakan gagal. Silakan coba lagi.",
    errForbidden: "Halaman ini hanya untuk admin platform.",
    orgTitle: "Organisasi",
    orgLimit: "Batas Operator",
    orgLimitSave: "Simpan Batas",
    orgLimitSaved: "Batas operator disimpan.",
    orgLimitRequired: "Batas operator wajib berupa angka 1 atau lebih.",
    orgDeactivate: "Nonaktifkan",
    orgActivate: "Aktifkan",
    orgDeactivateConfirm:
      "Nonaktifkan organisasi ini? Owner melihat layar langganan dan operator tidak bisa masuk. Data tidak dihapus.",
    orgActivateConfirm: "Aktifkan kembali organisasi ini? Akses mengikuti paket yang masih berlaku.",
    orgInactive: "Nonaktif",
  },

  // §16 rejection reasons: one-tap options, free text stays available.
  rr: {
    unreadable: "Bukti tidak terbaca",
    amountMismatch: "Jumlah tidak sesuai",
    notTransfer: "Bukan bukti transfer",
    other: "Lainnya",
  },

  nav: {
    ownerSubtitle: "Dashboard Owner",
    operatorSubtitle: "Dashboard Operator",
    dashboard: "Beranda",
    operators: "Operator",
    files: "Berkas",
    logout: "Keluar",
  },

  own: {
    title: "Beranda",
    welcome: (name: string) => `Selamat datang, ${name}`,
    org: (org: string) => `Biro jasa: ${org}`,
    plan: (plan: string, date: string) => `Paket ${plan} · aktif sampai ${date}`,
    seats: "Slot Operator",
    seatsValue: (n: string, limit: string) => `${n} / ${limit} terpakai`,
    seatsCustom: "Sesuai kesepakatan", // A16: null operator limit; hide counter and over-limit alert
    revenue: "Pendapatan Bulan Ini",
    revenueHelp:
      "Pembayaran pelanggan dikurangi biaya SAMSAT. Hanya berkas yang sudah diambil bulan ini yang dihitung.",
    activeFiles: "Berkas Diproses",
    // §9: the same sum as the card above, split by operator. The owner's own berkas are a row
    // like any other — they may hold a seat, so their work is not a separate total.
    revenueByOp: "Pendapatan per Operator",
    revenueByOpEmpty: "Belum ada berkas yang diambil bulan ini.",
    // §12e: a count is a count. Never routed through formatRupiah, never summed into a total.
    revenueByOpCount: (n: string) => `${n} berkas`,
  },

  addop: {
    title: "Tambah Operator",
    counter: (used: string, limit: string) => `Slot operator: ${used} / ${limit}`,
    name: "Nama",
    email: "Email",
    password: "Password Awal",
    passwordHelp: "Minimal 8 karakter. Bagikan ke operator; mereka bisa menggantinya nanti.",
    submit: "Tambah Operator",
    submitting: "Menyimpan…",
    success: (name: string, email: string) =>
      `${name} sudah bisa masuk dengan ${email}. Berikan password yang baru Anda buat.`,
    failed: "Operator gagal ditambahkan.",
    limit: (used: string, limit: string) =>
      `Slot operator paket Anda sudah penuh (${used}/${limit}). Upgrade paket atau nonaktifkan operator lain.`,
    limitApi: "Slot operator paket Anda sudah penuh.",
    ownerOnly: "Hanya owner yang bisa menambah operator.",
    ownerOnlyEdit: "Hanya owner yang bisa mengubah operator.",
    notFound: "Operator tidak ditemukan.",
    overLimit: (n: string, limit: string) =>
      `Jumlah operator aktif melebihi paket Anda (${n}/${limit}). Nonaktifkan operator sampai sesuai batas.`,
  },

  opd: {
    title: "Beranda",
    welcome: (name: string) => `Selamat datang, ${name}`,
    myFiles: "Berkas Saya",
    pending: "Sedang Diproses",
    completed: "Selesai",
  },

  status: {
    DRAFT: "Draf",
    DP_PAID: "DP Diterima",
    ON_PROGRESS_SAMSAT: "Diproses di SAMSAT",
    COMPLETED_SAMSAT: "Selesai di SAMSAT",
    PICKED_UP: "Sudah Diambil",
    CANCELED: "Dibatalkan",
  },

  service: {
    STNK: "STNK",
    PLAT: "Ganti Plat",
    MUTASI: "Mutasi",
    SIM_A: "SIM A",
    SIM_B: "SIM B",
    SIM_C: "SIM C",
  },

  ownership: {
    PERORANGAN: "Perorangan",
    BADAN_USAHA: "Badan Usaha",
    PEMERINTAH: "Pemerintah",
    YAYASAN: "Yayasan",
  },

  empty: {
    myFilesTitle: "Belum ada berkas",
    myFilesBody: "Berkas yang Anda input akan muncul di sini.",
    myFilesAction: "Input Berkas",
    ownerFilesTitle: "Belum ada berkas",
    ownerFilesBody: "Berkas yang diinput operator akan muncul di sini.",
  },

  file: {
    sectionCustomer: "Data Pelanggan",
    sectionMoney: "Biaya",
    customerName: "Nama Pelanggan",
    customerNameError: "Nama pelanggan wajib diisi.",
    customerKtp: "NIK KTP",
    customerKtpHelp: "16 angka, sesuai KTP.",
    customerKtpError: "NIK harus 16 angka.",
    vehicleNumber: "Nomor Kendaraan",
    vehicleNumberHelp: "Contoh: B 1234 XYZ.",
    vehicleNumberError: "Nomor kendaraan wajib diisi.",
    ownershipType: "Jenis Kepemilikan",
    serviceType: "Jenis Layanan",
    notes: "Catatan",
    notesPlaceholder: "Opsional",
    estimatedPrice: "Estimasi Biaya",
    estimatedPriceHelp: "Angka saja, tanpa titik. Contoh: 1500000",
    dpAmount: "DP Diterima",
    dpAmountHelp: "Biasanya 50% dari estimasi. Isi 0 jika belum ada DP.",
    finalPrice: "Total Dibayar Pelanggan",
    finalPriceHelp: "Diisi saat berkas selesai.",
    samsatPayment: "Biaya SAMSAT",
    samsatPaymentHelp: "Biaya yang dibayarkan ke SAMSAT.",
    serviceFee: "Jasa Anda",
    moneyError: "Masukkan angka tanpa titik atau koma.",
    status: "Status",
    pickedUpAt: "Diambil pada",
    createdAt: "Diinput pada",
    submit: "Simpan Berkas",
    // §12e: one key, both detail screens — FileForm renders it for operator and owner alike.
    print: "Cetak Surat Jalan",
    printCancelled:
      "Berkas yang sudah dibatalkan tidak punya Surat Jalan untuk dicetak.",
    update: "Simpan Perubahan",
    submitting: "Menyimpan…",
    cancel: "Batal",
    saved: "Berkas berhasil disimpan.",
    updated: "Perubahan berkas disimpan.",
    failed: "Berkas gagal disimpan. Silakan coba lagi.",
    confirmLeave: "Isian belum disimpan. Yakin ingin meninggalkan halaman ini?",
    statusChanged: (status: string) => `Status berkas diubah menjadi ${status}.`,
    pickupGuard: "Total dibayar pelanggan harus diisi dan tidak boleh lebih kecil dari biaya SAMSAT.",
    terminalNote: "Berkas yang sudah diambil atau dibatalkan tidak bisa diubah statusnya lagi.",
    cancelStatus: "Batalkan berkas",
    cancelConfirm:
      "Batalkan berkas ini? Berkas yang dibatalkan tidak dihitung dalam pendapatan dan tidak bisa dikembalikan ke status sebelumnya.",
    cancelConfirmYes: "Ya, Batalkan",
    cancelConfirmNo: "Tidak",
    cancelled: "Berkas dibatalkan.",
  },

  th: {
    customer: "Pelanggan",
    vehicle: "Kendaraan",
    service: "Layanan",
    status: "Status",
    revenue: "Jasa",
    operator: "Operator",
    date: "Tanggal",
    edit: "Ubah", // th.actions: single icon button, aria-label only. No delete (§12c).
    ownership: "Jenis Kepemilikan",
  },

  filter: {
    all: "Semua",
  },

  notFound: "Halaman belum tersedia", // A16
} as const;
