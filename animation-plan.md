# Rencana Animasi Landing Page — ANS Mini Football

> Status: SUDAH DIIMPLEMENTASI. Lint + build hijau (vite 8, framer-motion 14.10.1).

## 1. Ringkasan Temuan

**Stack:** React 19.3.1 + Vite 8 (SPA murni, tanpa SSR/hydration), Tailwind CSS v4 via `@tailwindcss/vite` (design token di `src/index.css` blok `@theme`), react-router-dom 7, react-hot-toast, lucide-react, axios, zustand. Tidak ada test framework; kualitas dijaga eslint.

**Library animasi:** `framer-motion@^14.10.1` **sudah terpasang** di `main-website/package.json` → dipakai apa adanya, import dari `"framer-motion"`. Catatan: import `motion/react` hanya berlaku untuk paket `motion`; tidak perlu menambah dependensi baru.

**Struktur komponen (`main-website/src/`):**

| File | Isi | Catatan penting |
|---|---|---|
| `pages/Home.jsx` | Menyusun `Hero` → `main(FieldCarousel, Testimonials, CtaBanner)` → `Footer` | — |
| `components/home/Hero.jsx` | Hero + **Navbar di-render di dalamnya** | Section `overflow-hidden` + bg img `absolute inset-0`; form GET `/pesan-lapangan` |
| `components/layout/Navbar.jsx` | Header dalam `Container` | Menu mobile = satu `<nav>` toggle class `hidden/flex` via state; desktop selalu tampil via `md:flex` |
| `components/home/FieldCarousel.jsx` | Carousel lapangan | **Bukan state-index**: scroll-snap native (`snap-x snap-mandatory`) + clone ujung (infinite loop) + `scrollBy` smooth + `busy` lock + `scrollend` + jump instan. Swipe native sudah berfungsi |
| `components/home/Testimonials.jsx` | Carousel testimoni | Mekanisme identik dengan FieldCarousel |
| `components/home/CtaBanner.jsx` | Banner CTA | Bg img absolute dalam `overflow-hidden rounded-2xl` |
| `components/layout/Footer.jsx` | Footer | Grid 3 kolom + ikon sosial SVG inline |
| `main.jsx` | Entry | Belum ada `MotionConfig` |

**Implikasi:** (a) transisi slide searah + swipe touch **sudah diberikan gratis oleh scroll-snap native**; (b) navbar sticky bermasalah karena parent hero `overflow-hidden` — `position: sticky` tidak akan bekerja melewati hero (lihat §7).

## 2. Arsitektur Animasi

### File baru

| File | Isi | Alasan |
|---|---|---|
| `src/lib/motion.js` | `EASE = [0.22, 1, 0.36, 1]`, `DUR = { fast: 0.3, base: 0.55, slow: 0.8 }`, variants `fadeUp`, `fadeIn`, `popStar`, `iconShift`, `tapScale`, helper `stagger(step)` dan `viewportOnce(amount)` | Satu sumber nilai durasi/easing/jarak — konsisten, mudah diubah sekali |
| `src/components/common/Reveal.jsx` | `<Reveal delay={0} y={24} amount={0.3} className>` → `motion.div` dengan `initial`/`whileInView`/`viewport { once: true }` | Satu pola reveal untuk semua section non-hero; mendukung prop `delay` dan `y` sesuai permintaan |
| `src/components/common/CountUp.jsx` | Angka count-up saat in-view (`useInView` + `animate()` dari framer-motion; props `to`, `decimals`) | Rating 4.6 / 5.0 tanpa duplikasi logika di dua carousel |

### File yang diubah

`main.jsx` (bungkus `<MotionConfig reducedMotion="user">` di sekeliling `RouterProvider`), `Hero.jsx`, `Navbar.jsx`, `FieldCarousel.jsx`, `Testimonials.jsx`, `CtaBanner.jsx`, `Footer.jsx`.

Semua perubahan bersifat menambah prop motion / membungkus elemen yang ada. Tidak ada copy, warna, radius, atau struktur visual yang diubah — kecuali dua pengecualian kecil yang ditandai di §7 (pemecah baris judul CTA, posisi navbar).

**Tanpa dependensi baru.**

## 3. Rencana per Section

### Navbar (`Navbar.jsx`, dipicu dari `Hero.jsx`)

| Elemen | Animasi | Variants/props | Waktu | 
|---|---|---|---|
| `<header>` | Turun dari atas saat load: `y: -24 → 0`, opacity 0→1 | `initial/animate` (terpisah dari stagger tree Hero, timing dikoordinasi lewat konstanta) | 0.55s EASE, delay 0 |
| Dropdown menu mobile | `AnimatePresence` + `motion.div` y:-8→0 + fade | `initial/animate/exit`, tinggi via transform (bukan height) | 0.25s |
| Sticky glass saat scroll | Setelah `scrollY > 24`: tambah `bg-white/80 backdrop-blur-md shadow-soft` + teks gelap | `useScroll` + `useMotionValueEvent` → state boolean; transisi warna via CSS `transition-colors` (murah, tanpa framer) | instan + CSS 200ms |

Detail sticky (KEPUTUSAN: fixed top-0): header menjadi `fixed top-0 inset-x-0 z-50` dengan `Container` di dalamnya. `position: fixed` tidak terpotong `overflow-hidden` milik section hero, dan tidak ada ancestor navbar yang dianimasikan transform, jadi aman. Konten Hero diberi padding-top pengganti ± tinggi navbar (±72px) karena elemen fixed tidak memakan ruang flow. Navbar tetap dirender di dalam `Hero.jsx` (posisi markup tidak berubah).

### Hero (`Hero.jsx`)

| Elemen | Animasi | Variants/props | Waktu |
|---|---|---|---|
| BG image | Zoom-out pelan `scale: 1.1 → 1` | `motion.img` `initial/animate` (bukan whileInView) | 1.5s EASE |
| Badge, h1, subtitle, card booking | Muncul berurutan dari bawah (y:24→0 + fade) | Parent `Container` = variants `staggerChildren: 0.12, delayChildren: 0.15`; children = `fadeUp` | 0.55s per child, EASE |
| Navbar | Turun dari atas (child pertama secara visual) | `initial/animate` sendiri, delay 0 | 0.55s EASE |

- Stagger hanya sekali saat mount; tidak ada repeat.
- `<select>`, `<input>`, `<button>` **tidak** pernah dijadikan motion element — yang dianimasikan wrapper-nya; form tetap berfungsi normal.
- Hanya hero yang pakai stagger; section lain satu pola Reveal yang sama.

### FieldCarousel (`FieldCarousel.jsx`)

| Elemen | Animasi | Waktu |
|---|---|---|
| Kolom kiri (h2, p, tombol prev/next) | `<Reveal>` | 0.55s, delay 0 |
| Track slide | `<Reveal delay={0.1}>` | 0.55s |
| Angka rating `4.6` | `<CountUp to={4.6} decimals={1}>` saat in-view | 0.9s |
| Bintang | Tiap bintang jadi `motion.span` pop `scale: 0.4→1` + fade, stagger 0.08 | 0.3s per bintang |
| Tombol bulat prev/next & link Maps | Mikro-interaksi (lihat bawah) | — |

Catatan: bintang partial-fill di `Stars` memakai inline `width: %` — **tidak dianimasikan** (aturan transform/opacity-only); hanya wrapper bintang yang di-pop, isi partial fill tetap CSS statis.

### Testimonials (`Testimonials.jsx`)

Sama seperti FieldCarousel: `<Reveal>` pada header + track, `5.0` via CountUp, 5 bintang polos pop stagger 0.08, mikro-interaksi pada tombol panah, link "Pesan Sekarang", dan tombol bulat di atas foto.

### CtaBanner (`CtaBanner.jsx`)

| Elemen | Animasi | Variants/props | Waktu |
|---|---|---|---|
| Banner utuh | `scale: 0.95→1` + fade saat masuk viewport | `whileInView` + `viewport once` | 0.6s EASE |
| Judul | Dipecah 2 baris (`motion.span` block) → fadeUp bertahap (KEPUTUSAN disetujui: markup berubah, visual identik) | delay 0 / 0.12s | 0.55s |
| Card kecil | fadeUp + y | delay 0.25s | 0.55s |
| BG image | Parallax ringan: `useScroll({ target, offset: ["start end","end start"] })` + `useTransform(progress, [0,1], [-24, 24])` → `style={{ y }}`, plus `scale: 1.1` statis agar tak muncul gap | scroll-linked | — |

Section tetap `overflow-hidden` → tidak ada scroll horizontal.

### Footer (`Footer.jsx`)

- 3 kolom + baris copyright: `<Reveal>` dengan delay bertingkat (0 / 0.08 / 0.16 / 0.24).
- Ikon sosial: `motion.a` `whileHover={{ y: -3 }}` + `whileTap` scale 0.97; warna hover tetap CSS.

### Mikro-interaksi tombol (semua file, konsisten)

- Pill button & tombol bulat → `motion.button` / `motion.a` / `motion(Link)` dengan `whileHover="hover" whileTap="tap"`.
- variants: parent hover `scale: 1.03`; `tap: { scale: 0.97 }`; ikon panah dibungkus `motion.span` dengan `iconShift: { x: 2, y: -2 }` (geser kanan-atas saat hover parent).
- CSS `transition-colors` untuk hover warna tetap berjalan — tidak konflik (framer hanya memegang transform).

## 4. Carousel & Testimoni — Rinci

**Kondisi sekarang (kedua komponen identik):** scroll-snap native + clone ujung untuk loop tak berujung + `scrollBy({behavior:"smooth"})` + lock `busy` + `scrollend` (dengan fallback timeout 700ms) + jump instan kembali ke slide asli. Transisi slide = smooth scroll native → **sudah searah** (next menggeser ke kiri, prev ke kanan) dan **swipe touch sudah native**.

### Opsi A — pertahankan scroll-snap (direkomendasikan)

- Transisi slide searah + drag/swipe sudah ada dan teruji; tidak ada AnimatePresence baru.
- Yang ditambah hanya polish: `<Reveal>` pada kontainer, CountUp, star pop, mikro-interaksi tombol.
- Risiko minim; kode existing (termasuk `inert` pada clone) tidak disentuh.
- Kekurangan: bukan pola AnimatePresence yang dituliskan harfiah di permintaan.

### Opsi B — rewrite ke index-based + AnimatePresence + drag="x" (sesuai bunyi permintaan)

- State: `const [[index, dir], setPage] = useState([0, 0])`; `paginate(delta)` wrap modulo.
- Struktur: `<AnimatePresence custom={dir} initial={false} mode="popLayout">` membungkus satu slide aktif; variants menerima `custom={dir}` → `enter: { x: dir > 0 ? "+100%" : "-100%" }`, `center: { x: 0 }`, `exit: { x: dir > 0 ? "-100%" : "+100%" }`.
- Drag: `drag="x"` + `dragConstraints={{ left: 0, right: 0 }}` + `dragElastic: 0.2` + `onDragEnd` membaca `offset.x`/`velocity` → paginate ±1.
- **Risiko:** (1) kehilangan momentum/feel scroll native; (2) infinite loop harus dirombak — pola clone tidak cocok dengan AnimatePresence, jadi loop jadi wrap-by-index (saat wrap dari terakhir → pertama, animasi arahnya mundur); (3) drag di dalam kontainer `overflow-x` rawan bentrok gesture; (4) rewrite kode yang sudah bekerja dan sudah accessible; (5) CountUp/star-pop harus re-trigger per slide aktif.
- Estimasi +80–120 baris dan risiko regresi nyata.

**KEPUTUSAN: Opsi A.** — carousel tetap scroll-snap native; AnimatePresence dipakai hanya untuk menu hamburger mobile (lihat Navbar). Opsi B tidak dikerjakan.

## 5. Checklist Aksesibilitas & Performa

- [x] `MotionConfig reducedMotion="user"` di `main.jsx` → menghormati `prefers-reduced-motion` (framer otomatis menonaktifkan animasi transform; hover warna CSS tetap jalan).
- [x] Fokus keyboard: semua class `focus-visible:outline-*` dipertahankan; animasi tidak pernah menyentuh properti fokus; menu mobile tetap menerima fokus setelah dibuka; `aria-expanded` / `aria-controls` hamburger dipertahankan.
- [x] Tanpa layout shift: reveal memakai transform y (bukan margin/height/padding); tidak ada animasi width/height/blur besar (backdrop-blur statis).
- [x] Tanpa scroll horizontal: parallax & zoom berada di dalam container `overflow-hidden` yang sudah ada; bg parallax diberi `scale: 1.1`.
- [x] Form, link, tombol tetap berfungsi: input/select tidak pernah jadi motion element; `motion.a`/`motion.button` mempertahankan semantik elemen asli.
- [x] `aria-hidden` + `inert` pada slide clone dipertahankan apa adanya (Opsi A).
- [x] Ukuran bundle: framer-motion sudah ada di lockfile → tambahan net-zero; import dari `"framer-motion"` di-tree-shake; target tambahan < ~15KB gz.
- [x] Performa HP menengah-bawah: hanya opacity/transform (compositor-friendly); `viewport { once: true }` di semua reveal; tidak ada animasi loop terus-menerus — satu-satunya scroll-linked adalah parallax CTA (murah, transform saja).
- [x] SPA tanpa SSR → tidak ada isu hydration.

## 6. Urutan Implementasi (tahap kecil, dites satu per satu)

| Tahap | Tujuan | File | Cara verifikasi |
|---|---|---|---|
| 1 | Fondasi: preset + `Reveal` + `MotionConfig` | `lib/motion.js`, `common/Reveal.jsx`, `main.jsx` | `npm run dev`; pasang sementara `<Reveal>` di CtaBanner; DevTools → emulate `prefers-reduced-motion: reduce` → animasi dilewati |
| 2 | Hero entrance + bg zoom + navbar drop | `Hero.jsx` | Reload `/`: urutan navbar → badge → judul → subtitle → card; bg zoom 1.5s; form masih submit ke `/pesan-lapangan` |
| 3 | Mikro-interaksi tombol di semua section | `Navbar/Hero/FieldCarousel/Testimonials/CtaBanner/Footer` | Hover: scale 1.03 + panah geser; tap: 0.97; hover warna tidak berubah perilaku |
| 4 | Reveal + CountUp + star pop | `FieldCarousel.jsx`, `Testimonials.jsx` | Scroll: section fade-up sekali; angka 4.6/5.0 menghitung naik; bintang pop berurutan; swipe di mobile emulation tetap jalan |
| 5 | CTA + Footer | `CtaBanner.jsx`, `Footer.jsx` | Scroll ke CTA: scale-in, judul bertahap, card delay, parallax halus tanpa gap; footer fade-up |
| 6 | Navbar sticky glass + menu mobile animasi | `Navbar.jsx` (± `Hero.jsx`) | Scroll >24px → glass muncul; viewport <768px: hamburger membuka dropdown beranimasi; fokus keyboard masuk menu |

Setiap tahap ditutup dengan `npm run lint` + cek cepat Chrome mobile emulation (klass menengah: throttle CPU 4x).

## 7. Risiko & Pertanyaan Terbuka

1. **Pendekatan carousel — SELESAI:** Opsi A dipilih (pertahankan scroll-snap). Opsi B dibatalkan.
2. **Navbar sticky — SELESAI:** header jadi `fixed top-0 inset-x-0 z-50`; konten Hero diberi jarak pengganti ± tinggi navbar. Navbar tetap dirender di dalam `Hero.jsx` (posisi markup), hanya styling posisi yang berubah.
3. **Judul CTA dipecah 2 span — SELESAI:** boleh, markup berubah sedikit, tampilan visual identik.
4. **CountUp di dalam slide clone** akan terpicu juga saat clone terlihat (sekali, karena `once: true`) — efek samping kecil yang tidak terlihat pengguna; tidak ditangani.
5. `motion(Link)` membutuhkan ref — react-router v7 `Link` sudah forwardRef, aman.
6. framer-motion v14 sudah terpasang → dipakai, bukan menambah paket `motion` baru (rekomendasi `motion/react` di PROMPT hanya berlaku bila belum ada yang terpasang).
