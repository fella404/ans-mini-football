# PRD: Website Pemesanan Online Lapangan Mini Soccer

| | |
|---|---|
| Versi | 1.0 |
| Tanggal | 6 November 2026 |
| Jenis proyek | Proyek kuliah (prioritas: sederhana, langsung berfungsi) |
| Dokumen terkait | `ERD.md` (desain database, dibuat terpisah) |

---

## 1. Ringkasan

Website pemesanan online untuk satu tempat usaha mini soccer. Customer memesan lapangan **tanpa login** (cukup nama dan no HP), membayar lewat transfer manual atau QRIS, lalu mengunggah bukti pembayaran. Admin dan staff memverifikasi pembayaran dan mengelola jadwal lewat admin panel. Notifikasi ke customer dikirim otomatis lewat WhatsApp gateway.

### Tujuan
- Pemesanan tercatat otomatis, sehingga tidak ada lagi kesalahan pencatatan manual (misalnya durasi salah catat).
- Customer bisa melihat ketersediaan jadwal dan memesan tanpa menunggu balasan staff.
- Rekap pesanan bisa diunduh langsung, tanpa mengetik ulang.

### Prinsip Desain
Sistem dibuat **sesederhana mungkin**. Fitur yang hanya "bagus kalau ada" sengaja tidak dimasukkan (lihat bagian 3).

---

## 2. Pengguna dan Role

| Role | Login | Keterangan |
|---|---|---|
| **Customer** | Tidak | Memesan lapangan dengan mengisi nama dan no HP. Mengakses pesanannya lewat kode booking. |
| **Staff** | Ya (email + password) | Menangani operasional harian: verifikasi pembayaran, pesanan manual, menandai pesanan selesai. |
| **Admin** | Ya (email + password) | Semua hak staff, ditambah pengelolaan staff, lapangan, jam dan tarif, export, dan data pembayaran. |

Akun admin maupun staff hanya memiliki data: nama, email, password, dan role. Tidak ada username.

---

## 3. Ruang Lingkup

### Termasuk
- Landing page, form pemesanan, halaman detail pesanan, dan halaman cek pesanan untuk customer.
- Admin panel: dashboard, pesanan, jadwal, lapangan, staff, export, pengaturan.
- Pembayaran manual (transfer rekening atau QRIS) dengan unggah bukti.
- Opsi bayar penuh (Full) atau DP.
- Pembatalan otomatis jika tidak dibayar dalam 30 menit.
- Notifikasi WhatsApp otomatis.

### Tidak Termasuk
- Login customer, akun member, atau promo.
- Payment gateway otomatis.
- Alur refund (dicatat manual di luar sistem).
- Fitur lupa/reset password mandiri untuk admin dan staff.
- Perlindungan brute force, refresh token.
- Antrean dan retry pengiriman WA, tabel log WA.
- Log riwayat perubahan status secara terpisah.
- Pembayaran dan pemesanan multi-lapangan dalam satu transaksi.

---

## 4. Tech Stack

| Bagian | Teknologi |
|---|---|
| Bahasa | JavaScript |
| Frontend | React, Tailwind CSS, Zustand, react-hot-toast |
| Backend | Express |
| Database | PostgreSQL (Supabase) |
| Akses database | **Raw SQL** + `pg` (node-postgres), migrasi lewat file `.sql` |
| Penyimpanan file | Supabase Storage (bukti transfer) |
| Autentikasi | JWT tanpa refresh token, disimpan di cookie |
| Penjadwalan tugas | `node-cron` di Express |
| Notifikasi | WhatsApp gateway (API pihak ketiga) |

Zona waktu seluruh sistem: **WIB**.

### 4.1 Akses Database dengan Raw SQL

Seluruh akses database menggunakan **raw SQL** lewat driver `pg` (node-postgres). Tidak menggunakan ORM apa pun (Prisma, TypeORM, Sequelize, dan sejenisnya).

- **Definisi schema:** tabel, kolom, tipe, relasi, dan index didefinisikan di file migrasi SQL (folder `migrations/`), lalu dijalankan ke database.
- **Koneksi:** `new Pool()` dari `pg` yang terhubung ke Supabase lewat connection string di `.env`.
- **Query:** tulis SQL secara eksplisit dengan parameterized query (`pool.query('SELECT ... WHERE id = $1', [id])`) untuk mencegah SQL injection. Transaksi memakai client dari `pool.connect()` dengan `BEGIN` / `COMMIT` / `ROLLBACK`.
- **Migrasi:** perubahan schema dibuat sebagai file `.sql` berurutan di folder `migrations/`, lalu diterapkan lewat script migrasi (`npm run migrate`) saat setup/deploy.
- **Constraint penting:** aturan anti double booking (bagian 5.2) diwujudkan sebagai **unique index** yang dideklarasikan di file migrasi SQL.
- **Seed:** data awal (akun admin, lapangan, slot jam dan tarif) dibuat lewat script seed yang memakai raw SQL.
- **Bentuk data:** hasil query mengikuti kolom tabel yang didefinisikan di migrasi (berupa objek row dari `pg`). Validasi input dan bentuk data di boundary API dilakukan di layer aplikasi (misalnya dengan Zod).

`ERD.md` tetap menjadi acuan desain tabel; file migrasi SQL adalah implementasi dari dokumen tersebut.

---

## 5. Aturan Bisnis

### 5.1 Jam, Durasi, dan Tarif
- Pemesanan dihitung per jam dengan slot tetap, mulai **05:00** sampai **24:00**.
- Customer memilih **jam mulai** dan **durasi 1 sampai 4 jam**. Durasi 2 jam berarti 2 slot berurutan, dan seluruh slot harus tersedia dan berada di hari yang sama.
- Skema tarif per jam mengikuti 4 rentang waktu:

| Rentang | Keterangan |
|---|---|
| 05:00 - 16:00 | Tarif 1 |
| 16:00 - 18:00 | Tarif 2 |
| 18:00 - 22:00 | Tarif 3 |
| 22:00 - 24:00 | Tarif 4 |

- Nominal tarif diatur admin per jam di halaman Jadwal. Rentang di atas menjadi acuan pengelompokan harga. Tarif berlaku sama untuk semua lapangan.
- Total pesanan = jumlah tarif seluruh jam yang dipilih.

### 5.2 Ketentuan Pemesanan
- Tanggal yang bisa dipilih: mulai hari ini sampai 30 hari ke depan (batas bisa diubah). Jam yang sudah lewat pada hari ini tidak bisa dipilih.
- Nama wajib diisi. No HP wajib diisi dengan format nomor Indonesia (misalnya `08xx` atau `628xx`) dan dinormalisasi ke format `62` untuk WA gateway.
- Hanya lapangan berstatus aktif dan slot jam aktif yang bisa dipesan.
- Satu slot pada satu lapangan di satu tanggal tidak boleh dimiliki dua pesanan aktif. Aturan ini harus dijaga di level database lewat unique index (dideklarasikan di file migrasi SQL), bukan hanya di validasi aplikasi.
- Setiap pesanan memiliki **kode booking** acak 8 karakter (huruf besar dan angka, tanpa karakter yang mudah tertukar seperti `0/O` dan `1/I`).

### 5.3 Pembayaran
- Customer memilih **Full** (bayar total) atau **DP** (bayar persentase tertentu dari total, default 50%, dapat diubah di pengaturan).
- Sisa pembayaran pada opsi DP dilunasi di tempat. Admin atau staff mencatatnya saat menandai pesanan selesai.
- Metode bayar: transfer ke nomor rekening atau scan QRIS.
- Bukti pembayaran berupa **satu file gambar** (jpg/png) maksimal 2 MB, disimpan di Supabase Storage. Customer boleh mengunggah ulang selama pesanan masih `pending_payment`.

### 5.4 Batas Waktu
- Setelah customer menekan Konfirmasi, customer punya waktu **30 menit** untuk mengunggah bukti.
- Timer **hanya berlaku saat `pending_payment`**. Saat bukti sudah diunggah (`waiting_approval`), timer berhenti agar admin tidak diburu-buru.
- Jika admin menolak bukti, pesanan kembali ke `pending_payment` dan timer **diulang 30 menit dari saat penolakan**.
- Pesanan `pending_payment` yang melewati batas waktu otomatis menjadi `cancelled`. Pengecekan dilakukan oleh cron yang berjalan setiap 1 menit. Slot yang dibatalkan langsung tersedia kembali.

---

## 6. Status Pesanan

| Status | Arti |
|---|---|
| `pending_payment` | Pesanan dibuat, menunggu pembayaran dan bukti dari customer |
| `waiting_approval` | Bukti sudah diunggah, menunggu verifikasi admin/staff |
| `PAID` | Pembayaran valid, jadwal terkonfirmasi |
| `completed` | Pertandingan sudah selesai dimainkan |
| `cancelled` | Pesanan dibatalkan (oleh customer, sistem, atau admin) |

### Transisi yang Diizinkan

| Dari | Ke | Pemicu |
|---|---|---|
| (baru) | `pending_payment` | Customer mengonfirmasi pesanan |
| `pending_payment` | `waiting_approval` | Customer mengunggah bukti |
| `pending_payment` | `cancelled` | Customer membatalkan, timeout 30 menit, atau dibatalkan admin |
| `waiting_approval` | `PAID` | Admin/staff menekan Accept |
| `waiting_approval` | `pending_payment` | Admin/staff menekan Reject (wajib alasan) |
| `PAID` | `completed` | Admin/staff menekan Selesai |
| `PAID` | `cancelled` | Dibatalkan admin/staff dengan alasan |

Transisi di luar tabel ini ditolak oleh backend. Pembatalan menyimpan siapa yang membatalkan (customer, sistem, atau admin) dan alasannya.

---

## 7. Alur Pemesanan

### 7.1 Alur Customer

1. Customer membuka landing page, lalu klik **Pesan Sekarang**.
2. Di halaman pemesanan, customer memilih tanggal, lapangan, jam mulai dan durasi, mengisi nama dan no HP, lalu memilih Full atau DP. Ringkasan total ditampilkan sebelum konfirmasi.
3. Customer menekan **Konfirmasi**. Sistem membuat pesanan berstatus `pending_payment`, menahan slot, dan memulai timer 30 menit.
4. WA otomatis **#1** dikirim ke customer (pesanan terbuat). Customer diarahkan ke halaman detail pesanan.
5. Di halaman detail, customer melihat nominal yang harus dibayar, nomor rekening, tombol unduh QRIS, dan countdown. Customer mentransfer, lalu **mengunggah bukti transfer**. Status berubah menjadi `waiting_approval`.
6. Admin/staff memverifikasi bukti:
   - **Valid:** Accept, status menjadi `PAID`, WA otomatis **#2** dikirim (pesanan disetujui).
   - **Tidak valid:** Reject dengan alasan, status kembali ke `pending_payment` dan timer diulang. Alasan tampil di halaman detail pesanan.
7. Customer datang dan bermain. Setelah selesai, admin/staff mengubah status menjadi `completed`.

Selama masih `pending_payment`, customer dapat membatalkan sendiri pesanannya dari halaman detail.

### 7.2 Alur Pesanan Manual (Walk-in)
Staff membuka halaman Jadwal, klik slot kosong, mengisi nama (no HP opsional), dan memilih durasi. Pesanan langsung berstatus `PAID` dengan pembayaran Full, tanpa WA otomatis. Alur ini menjaga agar jadwal di sistem selalu sama dengan keadaan di lapangan.

---

## 8. Halaman Customer

| Halaman | Route | Fungsi |
|---|---|---|
| Landing page | `/` | Informasi tempat dan pintu masuk pemesanan |
| Form pemesanan | `/pesan` | Membuat pesanan baru |
| Detail pesanan | `/booking/:kode` | Pembayaran, status, dan pembatalan |
| Cek pesanan | `/cek-pesanan` | Mencari pesanan lewat kode booking |

### 8.1 Landing Page (`/`)
Satu halaman dengan beberapa section:
- Hero dengan tombol **Pesan Sekarang**.
- Daftar lapangan.
- Tarif (berdasarkan 4 rentang waktu).
- Jam operasional.
- Lokasi dan kontak.

### 8.2 Form Pemesanan (`/pesan`)
Satu halaman, berurutan dari atas ke bawah:
1. Pilih tanggal.
2. Pilih lapangan (hanya yang aktif).
3. Grid jam: slot yang sudah terisi tampil abu-abu dan tidak bisa dipilih. Customer memilih jam mulai, lalu durasi 1 sampai 4 jam.
4. Isi nama dan no HP.
5. Pilih Full atau DP. Ringkasan total dan nominal yang dibayar tampil di bawah.
6. Tombol **Konfirmasi**. Setelah sukses, redirect ke `/booking/:kode`.

Validasi form ditampilkan lewat pesan error di bawah field, dan hasil aksi lewat toast.

### 8.3 Detail Pesanan (`/booking/:kode`)
Menampilkan data pesanan (kode, lapangan, tanggal, jam, total, tipe bayar) dan konten yang berubah sesuai status:

| Status | Yang ditampilkan |
|---|---|
| `pending_payment` | Countdown 30 menit, nominal yang harus dibayar, nomor rekening, tombol unduh QRIS, form unggah bukti, tombol **Batalkan**. Jika sebelumnya ditolak, tampilkan alasan penolakan |
| `waiting_approval` | Pesan "Bukti diterima, menunggu verifikasi admin" |
| `PAID` | Pesan "Pesanan terkonfirmasi" dan informasi sisa pembayaran jika DP |
| `completed` | Pesan "Pesanan selesai" |
| `cancelled` | Pesan "Pesanan dibatalkan" beserta alasan |

Kode booking yang acak berfungsi sebagai satu-satunya akses ke halaman ini. Tidak ada login atau verifikasi tambahan.

### 8.4 Cek Pesanan (`/cek-pesanan`)
Satu input kode booking. Jika ditemukan, customer diarahkan ke `/booking/:kode`. Jika tidak, muncul pesan "Kode tidak ditemukan". Berguna ketika customer kehilangan link dari WA.

---

## 9. Admin Panel

| Halaman | Route | Admin | Staff |
|---|---|---|---|
| Login | `/admin/login` | Ya | Ya |
| Dashboard | `/admin` | Ya | Ya |
| Pesanan | `/admin/pesanan` | Ya | Ya |
| Jadwal | `/admin/jadwal` | Ya | Ya (terbatas) |
| Lapangan | `/admin/lapangan` | Ya | Tidak |
| Staff | `/admin/staff` | Ya | Tidak |
| Export | `/admin/export` | Ya | Tidak |
| Pengaturan | `/admin/pengaturan` | Ya | Ya (terbatas) |

### 9.1 Login
**Fungsi:** masuk sebagai admin atau staff.
- Form email dan password. Setelah berhasil, JWT disimpan di cookie dan pengguna diarahkan ke dashboard.
- Semua route admin diproteksi. Pengguna yang belum login diarahkan ke halaman ini.
- Menu dan endpoint yang bisa diakses mengikuti role.

### 9.2 Dashboard
**Fungsi:** ringkasan cepat dan pintu masuk ke pekerjaan yang mendesak.
- Kartu ringkasan:
  - jumlah pesanan **menunggu verifikasi** (klik untuk membuka halaman Pesanan dengan filter tersebut),
  - jumlah pesanan hari ini,
  - total pendapatan bulan ini (dari pesanan `PAID` dan `completed`).
- Daftar jadwal main hari ini, urut jam.
- Daftar pesanan terbaru yang butuh tindakan.
- Pembaruan data cukup dengan refresh manual atau polling tiap 30 detik.

### 9.3 Pesanan
**Fungsi:** halaman kerja utama untuk memverifikasi pembayaran dan mengelola status pesanan.
- Tabel pesanan: kode, nama, no HP, lapangan, tanggal main, jam, total, tipe bayar, badge status.
- Filter berdasarkan status dan tanggal, serta pencarian berdasarkan nama, no HP, atau kode.
- Detail pesanan (drawer atau modal): data lengkap dan **preview bukti transfer**.
- Aksi sesuai status:
  - `waiting_approval`: **Accept** (menjadi `PAID`, WA #2 terkirim) dan **Reject** (wajib isi alasan, kembali ke `pending_payment`).
  - `PAID`: **Selesai** (menjadi `completed`). Untuk pesanan DP, admin/staff mencatat bahwa sisa pembayaran sudah dilunasi.
  - `pending_payment` dan `PAID`: **Batalkan** dengan alasan.
- Tombol **Chat WA** berupa link `wa.me/<nomor>` untuk menghubungi customer.
- Backend menolak transisi status yang tidak valid (bagian 6).

### 9.4 Jadwal
**Fungsi:** melihat ketersediaan dan mengatur jam beserta tarif.
- **Tampilan harian** (admin dan staff): pilih tanggal, lalu tampil daftar jam per lapangan dengan penanda kosong atau terisi (nama pemesan dan status).
- **Pesanan manual walk-in** (admin dan staff): klik slot kosong, isi data, pesanan langsung `PAID` (bagian 7.2).
- **Jam dan tarif** (hanya admin): CRUD slot jam dengan jam mulai, jam selesai, tarif, dan status aktif/nonaktif.

### 9.5 Lapangan
**Fungsi:** mengelola daftar lapangan (hanya admin).
- CRUD dengan dua field: nama dan status (aktif/nonaktif).
- Lapangan nonaktif tidak muncul di form pemesanan customer.
- Lapangan yang sudah memiliki pesanan tidak boleh dihapus, hanya dinonaktifkan.

### 9.6 Staff
**Fungsi:** mengelola akun staff (hanya admin).
- CRUD staff dengan data nama, email, dan status aktif/nonaktif.
- Tombol **reset password** yang mengembalikan password staff ke `12345678`. Staff diharapkan menggantinya lewat Pengaturan.
- Akun dengan role admin tidak dikelola dari halaman ini.

### 9.7 Export
**Fungsi:** mengunduh rekap pesanan untuk laporan (hanya admin).
- Filter rentang tanggal dan status, lalu tombol **Download CSV**.
- Kolom: kode, tanggal pesan, nama, no HP, lapangan, tanggal main, jam, total, tipe bayar, status.

### 9.8 Pengaturan
**Fungsi:** akun pribadi dan data pembayaran.
- **Ganti password** (admin dan staff): password lama, password baru, dan konfirmasi.
- **Data pembayaran** (hanya admin): nomor rekening, nama bank, atas nama, gambar QRIS, dan persentase DP. Lihat bagian 12 untuk keputusan implementasinya.

---

## 10. Notifikasi WhatsApp

| # | Pemicu | Isi pesan |
|---|---|---|
| 1 | Pesanan dikonfirmasi (status `pending_payment`) | Pesanan telah terbuat, kode booking, lapangan, tanggal, jam, total, batas waktu bayar, dan link ke `/booking/:kode` |
| 2 | Admin/staff menekan Accept (status `PAID`) | Pesanan disetujui, ringkasan jadwal, dan informasi sisa pembayaran jika DP |

Ketentuan:
- Pengiriman bersifat "fire and forget": dipanggil di dalam `try/catch`, dan kegagalan cukup dicatat di log server.
- Kegagalan kirim WA **tidak boleh** menggagalkan pesanan. Customer tetap bisa melihat status di halaman detail.
- Pesanan manual walk-in tidak mengirim WA.

---

## 11. Persyaratan Non-Fungsional

- **Keamanan dasar:** password disimpan dalam bentuk hash. Endpoint admin dilindungi JWT dan pengecekan role. File bukti disimpan di bucket private dan ditampilkan ke admin lewat URL bertanda tangan sementara.
- **Konsistensi data:** pencegahan double booking dijaga di level database (unique index via file migrasi SQL), dan transisi status divalidasi di backend.
- **Tampilan:** responsif untuk ponsel, karena customer paling banyak mengakses lewat HP. Admin panel nyaman dipakai di desktop dan tablet.
- **Umpan balik pengguna:** hasil aksi (sukses atau gagal) ditampilkan lewat toast, dan error validasi ditampilkan di bawah field.
- **Kinerja:** tidak ada target khusus. Cukup berjalan lancar untuk satu tempat usaha dengan beberapa lapangan.

---

## 12. Keputusan yang Belum Final

| Topik | Opsi | Catatan |
|---|---|---|
| Penyimpanan data pembayaran (rekening, QRIS, persentase DP) | (a) file config / `.env` + gambar QRIS di folder `public`; (b) diatur lewat halaman Pengaturan | (a) lebih cepat dibuat, (b) lebih lengkap saat demo |
| WA saat bukti ditolak | Tambahkan atau tidak | Disarankan agar customer tahu tanpa harus membuka halaman. Tanpa WA, alasan penolakan hanya terlihat di halaman detail |
| Persentase DP | Nilai default 50% | Perlu dikonfirmasi dengan pemilik |
| Batas hari pemesanan ke depan | Default 30 hari | Perlu dikonfirmasi dengan pemilik |
| Tarif berbeda per lapangan | Saat ini sama untuk semua lapangan | Bisa dikembangkan nanti jika dibutuhkan |

---

## 13. Dokumen Lanjutan

- `ERD.md`: desain database dan relasi antar tabel (menyusul, dipisah dari dokumen ini).
- File migrasi SQL (`migrations/`): implementasi dari ERD dan sumber kebenaran struktur database saat runtime.
