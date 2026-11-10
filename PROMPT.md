# Peran

Kamu adalah senior frontend engineer yang ahli React dan animasi UI dengan Framer Motion (paket `motion` / `framer-motion`).

# Tugas

Buat RENCANA (planning) untuk menambahkan animasi pada landing page ANS Mini Football. JANGAN mengubah kode apa pun pada tahap ini. Output tugas ini hanya satu file: `animation-plan.md` di root proyek.

# Konteks proyek

- Landing page website booking lapangan mini football (React JS), gaya "fresh sporty minimalism": satu warna dominan hijau, background krem, kartu putih dengan radius besar, tombol pill dengan lingkaran ikon panah.
- Urutan section di halaman:
  1. Navbar (logo, menu Home / Pesan Lapangan / Cek Pesanan, tombol Hubungi Kami, hamburger di mobile)
  2. Hero: background image, badge, title, subtitle, card "Booking Slot Cepat" (dropdown lapangan, tanggal, jam, durasi, tombol Konfirmasi)
  3. Carousel "Pilih Lapangan": title, subtitle, tombol prev/next, card lapangan (gambar, nama, rating, bintang, jumlah review, tombol panah)
  4. Testimonial: judul, tombol Pesan Sekarang, foto tim, kutipan, nama, rating 5.0 + bintang, tombol prev/next
  5. CTA banner besar dengan gambar latar dan card kecil berisi tombol Booking Jadwal
  6. Footer: brand, subtitle, ikon sosial, list navigasi, list media sosial, copyright

# Langkah wajib sebelum menulis rencana

1. Telusuri struktur proyek: file komponen tiap section, cara styling (Tailwind/shadcn/CSS), versi React, dan bundler.
2. Cek `package.json`: apakah `framer-motion` atau `motion` sudah terpasang. Gunakan yang sudah ada. Jika belum ada, rekomendasikan `motion` dan import dari `motion/react`.
3. Cek bagaimana carousel dan testimonial dibuat saat ini (state index, scroll-snap, atau library), karena ini menentukan pendekatan transisi.
4. Jika ada hal yang ambigu atau berisiko, tulis sebagai "Pertanyaan terbuka" di rencana. Jangan berasumsi diam-diam.

# Animasi yang harus direncanakan

Prioritas tinggi:

1. Hero stagger entrance: navbar turun dari atas, lalu badge, title, subtitle, dan card booking muncul berurutan dari bawah (variants + staggerChildren sekitar 0.12). Background image zoom-out pelan (scale 1.1 ke 1, sekitar 1.5 detik).
2. Scroll reveal konsisten di semua section selain hero lewat satu komponen reusable `<Reveal>` (fade + naik 24px, whileInView, viewport once: true, amount sekitar 0.3). Dukung prop `delay` dan `y`.
3. Micro-interaction tombol: tombol pill dan tombol bulat memakai whileHover (scale sekitar 1.03) dan whileTap (scale sekitar 0.97); ikon panah di dalam lingkaran bergeser sedikit ke kanan atas saat hover.
4. Transisi slide carousel lapangan dan testimoni: AnimatePresence dengan custom direction (next: keluar ke kiri, masuk dari kanan; prev: kebalikannya). Carousel lapangan ditambah drag="x" untuk swipe di mobile.

Prioritas menengah: 5. Rating: angka (4.6 dan 5.0) hitung naik dari 0 saat masuk viewport; bintang muncul satu per satu (pop dengan stagger sekitar 0.08). 6. CTA banner: scale 0.95 ke 1 saat masuk viewport, judul muncul bertahap, card kecil naik dengan delay, parallax ringan pada gambar latar (useScroll + useTransform). 7. Navbar: setelah scroll jadi sticky dengan latar kaca (blur); menu hamburger mobile dianimasikan dengan AnimatePresence. 8. Footer: kolom dan ikon sosial fade-up berurutan; ikon sosial whileHover y: -3.

# Aturan teknis

- Animasikan hanya `opacity` dan `transform` (x, y, scale, rotate). Hindari animasi width/height/blur besar.
- Durasi 0.5 sampai 0.8 detik, easing lembut (misalnya cubic-bezier 0.22, 1, 0.36, 1). Tentukan nilai durasi, easing, dan jarak sebagai konstanta/preset terpusat (misalnya `src/lib/motion.js`) agar konsisten.
- Bungkus aplikasi dengan `<MotionConfig reducedMotion="user">` agar menghormati prefers-reduced-motion.
- Jangan mengubah desain visual, copy, atau struktur halaman; hanya menambah lapisan animasi.
- Pastikan animasi tidak menyebabkan layout shift atau scroll horizontal, tidak mengganggu fungsi form, link, dan tombol, serta tetap aman untuk SSR/hydration bila relevan.
- Hindari animasi berlebihan: hero cukup satu stagger, section lain satu pola reveal yang sama.
- Performa harus tetap baik di HP kelas menengah ke bawah.

# Format output `animation-plan.md`

1. Ringkasan temuan: stack, versi, library animasi yang dipakai, struktur komponen terkait.
2. Arsitektur animasi: daftar file baru dan file yang diubah (misalnya `lib/motion.js`, komponen `Reveal`, hook bantu), beserta alasannya.
3. Rencana per section: untuk tiap section tulis elemen yang dianimasikan, jenis animasi, variants/props kunci, durasi/delay/easing, dan file yang disentuh.
4. Rencana carousel dan testimoni secara rinci: cara menyimpan direction, struktur AnimatePresence, penanganan drag/swipe, dan risikonya.
5. Checklist aksesibilitas dan performa (reduced motion, fokus keyboard, layout shift, ukuran bundle).
6. Urutan implementasi dalam tahap kecil yang bisa dites satu per satu (tiap tahap: tujuan, file, cara verifikasi).
7. Risiko dan pertanyaan terbuka.

Setelah `animation-plan.md` selesai, berhenti dan tunggu persetujuan saya. Jangan mulai implementasi.
