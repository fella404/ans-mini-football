# 🤖 AI Agents Context & Instructions

## 🎯 Project Overview

Proyek ini menggunakan arsitektur PERN stack yang dimodifikasi. Backend menggunakan **Node.js + Express.js**, Database menggunakan **Supabase (PostgreSQL)** yang diakses lewat **raw SQL dengan driver `pg`**, sedangkan Authentication di-handle sendiri oleh backend Express menggunakan **JWT** (bukan Supabase Auth). Frontend dibangun menggunakan **React**.

## 📚 Core References

Sebelum menulis kode, merancang arsitektur, atau memberikan solusi, agen **HARUS** membaca dan memahami file berikut:

- **`PRD.md` (Product Requirements Document):** Untuk memahami fitur utama, ruang lingkup (scope), alur pengguna (user flow), dan batasan proyek.
- **`ERD.md` (Entity Relationship Diagram):** Untuk memahami struktur tabel database PostgreSQL, tipe data, dan relasi antar entitas yang akan diimplementasikan di Supabase.
- **`DESIGN.md`:** Referensi Desain Website.

## 🛠️ Tech Stack & Constraints

### Client / Frontend

- **Framework:** React (menggunakan Vite)
- **Styling:** Tailwind CSS (Pure Custom Components)
- **State Management:** Zustand
- **Routing:** React Router (v6+)
- **Notifications/Toasts:** React Hot Toast
- **Authentication Client:** JWT dari API Express, disimpan di cookie HTTP-only (tanpa Supabase Auth)

**Frontend Guidelines:**

1. Bangun komponen UI secara mandiri (custom components) menggunakan **Tailwind CSS**. Pisahkan komponen yang dapat digunakan kembali (reusable) seperti tombol, input, atau modal ke dalam folder `src/components/ui` atau `src/components/common`.
2. Gunakan Zustand untuk global state. Buat store terpisah berdasarkan domain/fitur (misal: `useAuthStore.js`, `useUserStore.js`).
3. Integrasikan session dan user state dari endpoint `GET /api/auth/me` (JWT di cookie) secara sinkron dengan Zustand.
4. Tangani navigasi dan perlindungan rute (Private/Public Routes) menggunakan React Router.
5. Tampilkan _feedback_ aksi pengguna (success/error) secara konsisten menggunakan React Hot Toast.

### Server / Backend

- **Framework:** Node.js dengan Express.js
- **Database:** Supabase PostgreSQL, diakses dengan raw SQL via `pg` (`new Pool()`), tanpa ORM
- **Authentication:** JWT sendiri (`jsonwebtoken`) + hash password (`bcryptjs`) pada tabel `users` kolom `password_hash`, tanpa Supabase Auth

**Backend Guidelines:**

1. Terapkan arsitektur modular: pisahkan `routes`, `controllers`, `middlewares`, dan `services`.
2. **Auth Middleware:** API endpoint yang bersifat _private_ harus dilindungi oleh middleware yang memverifikasi signature dan masa berlaku JWT (dari cookie HTTP-only, disimpan saat login) lalu mengisi `req.user`. Endpoint khusus admin dicek role-nya (`admin` / `staff`).
3. Interaksi database ke Supabase PostgreSQL harus mengikuti struktur tabel yang didefinisikan secara ketat pada `ERD.md`. Tulis SQL eksplisit dengan parameterized query (misal `pool.query('SELECT ... WHERE id = $1', [id])`); transaksi memakai `BEGIN` / `COMMIT` / `ROLLBACK`. Jangan memakai ORM (Prisma, TypeORM, Sequelize) dan jangan membuat skema di luar file migrasi SQL di `migrations/`.
4. Implementasikan _error handling_ menggunakan `try-catch` dan kembalikan response berformat JSON yang konsisten (misal: `{ success: boolean, data: any, message: string }`).

## 👨‍💻 Agent Roles & Prompts

### 1. Frontend & UI Agent

**Fokus:** Antarmuka pengguna, pembuatan komponen custom, state management, dan integrasi klien.
**Instruksi:** "Saat Anda diminta untuk membangun antarmuka, buatlah komponen yang bersih dan responsif menggunakan murni Tailwind CSS. Rujuk pada `PRD.md` untuk detail flow. Gunakan Zustand untuk menyimpan state dari hasil fetch API (termasuk user dari `/api/auth/me`), dan gunakan React Hot Toast untuk menangani state _loading_ atau pesan _error/success_."

### 2. Backend & API Agent

**Fokus:** Logika bisnis (layer services), Express routing, dan keamanan endpoint.
**Instruksi:** "Fokus pada pembuatan endpoint API Express yang efisien dan aman. Pastikan logika bisnis diletakkan pada layer `services`. Verifikasi identitas pengguna dengan memvalidasi JWT yang diterbitkan backend sendiri (dari cookie HTTP-only) sebelum memproses permintaan, dan cek role untuk endpoint admin. Jangan membuat skema database baru secara sepihak; selalu periksa kesesuaiannya dengan `ERD.md` dan tulis perubahannya sebagai file migrasi SQL di `migrations/`."

### 3. Database & Database Architect Agent

**Fokus:** Struktur data PostgreSQL, relasi, raw SQL, dan integritas data.
**Instruksi:** "Tugas Anda adalah merancang query SQL dan file migrasi. Baca `ERD.md` secara menyeluruh. Hasilkan script SQL di folder `migrations/` untuk pembuatan tabel, _foreign key_, index (termasuk unique index anti double booking), dan constraint. Akses database hanya lewat backend (`pg`), jadi keamanan data dijaga oleh validasi input, query parameterized, dan JWT/role di Express — bukan RLS Supabase."
