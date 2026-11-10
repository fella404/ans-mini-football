# Analisis Design Web EA SPORTS FC 27

> **Sumber:** https://www.ea.com/games/ea-sports-fc/fc-27
> **Tanggal analisis:** 2026-10-02
> **Tujuan:** Referensi theme untuk aplikasi Analisis Performa Tim Voli (lihat `docs/dev-agent/PRD.md`)
> **Agensi / Foundry:** Uncommon (brand), Buck (motion), F37 Foundry (typeface)

---

## 1. Design System Overview

Website FC 27 memakai **2 layer system**:

### 1.1 EA Global Chrome (Next.js)

Wrapper standar seluruh situs EA:

- Header / footer EA, login EA Account, language selector, legal & privacy
- Font: `ElectronicArtsDisplay` + `ElectronicArtsText`
- Form newsletter: `Email / Birthday / Country of residence`
- Tech: Next.js (`/_next/static/css/*.css`), preconnect ke `drop-api.ea.com`, `drop-assets.ea.com`

### 1.2 FC 27 Product System

Bahasa visual khusus FC, berbasis **segitiga / triangle**:

- Inspirasi: player indicator di atas kepala pemain + isometric camera era 8-bit + polygon taktik
- 3 eksekusi logo: primary logo, product prefix `FC` segitiga, authenticity mark untuk partner
- Gaya: **dark-first, immersive, content-first, sport-entertainment**

### 1.3 Pattern Halaman

```
Hero full-bleed 16:9 (keyart Mbappe + H1 + CTA Buy now + Watch Trailer)
  ↓
Spotlight (Ratings 19.000+ pemain + TOTW Vote Now black-gold card)
  ↓
Features (5 blok: The Grounds, Gameplay, Transfer Market, FUT Gallery, Authenticity)
  ↓
News grid (1 featured + 12 kartu)
  ↓
Follow us + Newsletter form
  ↓
Keyart penutup WELCOME TO THE WORLD'S GAME + Buy now
  ↓
Footer EA
```

### 1.4 Prinsip UI

- 90% background gelap, teks putih. Energi datang dari **foto**, bukan dari chrome UI.
- 1 warna aksen saja untuk aksi. Sisanya netral.
- Semua gambar pakai `AspectCrop=(16,9)` via `drop-assets.ea.com`.
- CTA bentuk pill, uppercase, bold.
- Card: gambar 16:9 + label kecil `News Article + tanggal` + judul 2 baris.

---

## 2. Color Palette

### 2.1 Brand Palette Resmi (sejak rebrand pisah FIFA 2023)

| Token Name       | Perkiraan HEX                   | Peran                                |
| ---------------- | ------------------------------- | ------------------------------------ |
| `Boot Black`     | `#000000` / `#0B0B0C`           | Background utama                     |
| `Chalk White`    | `#FFFFFF` / `#F6F6F2`           | Teks utama, logo                     |
| `Pitch Green`    | `#03ff94` / `#00c270` volt lime | CTA `Buy now`, highlight, link aktif |
| `Forest Green`   | `#014421` / `#044D2E`           | Gradient, background section dalam   |
| `Turnstile Grey` | `#8B8B8B`                       | Teks secondary, metal stadion        |
| `Terrace Grey`   | `#2B2B2B`                       | Border, surface card, divider        |

> EA hanya mempublish nama, bukan HEX publik. HEX di atas adalah observasi via DevTools pada tombol dan background. Untuk nilai pasti: inspect `Computed > background-color` pada tombol `Buy now`.

Warna konten musiman (bukan token, hanya di image):

- Ungu vibrant `#7A2BFF` — Pitch Notes / Launch Rewards
- Emas-hitam `#C9A86A on #000` — TOTW Community Player
- Biru-hijau — OTW Season 1

### 2.2 Three-Layer Tokens (siap pakai)

```css
/* === Primitive (raw values) === */
:root {
  --fc-boot-black: #0b0b0c;
  --fc-chalk-white: #ffffff;
  --fc-pitch-green: #03ff94;
  --fc-pitch-green-hover: #00c270;
  --fc-forest-green: #014421;
  --fc-turnstile-grey: #8b8b8b;
  --fc-terrace-grey: #2b2b2b;
  --fc-surface: #141414;
}

/* === Semantic (purpose aliases) === */
:root {
  --color-background: var(--fc-boot-black);
  --color-surface: var(--fc-surface);
  --color-text-primary: var(--fc-chalk-white);
  --color-text-secondary: var(--fc-turnstile-grey);
  --color-primary: var(--fc-pitch-green);
  --color-primary-hover: var(--fc-pitch-green-hover);
  --color-border: var(--fc-terrace-grey);
}

/* === Component (component-specific) === */
:root {
  --button-bg: var(--color-primary);
  --button-text: #000000;
  --button-bg-hover: var(--color-primary-hover);
  --card-bg: var(--color-surface);
  --card-border: var(--color-border);
  --nav-text: var(--color-text-primary);
  --meta-text: var(--color-text-secondary);
}
```

Aturan pakai:

1. Jangan pakai HEX mentah di komponen — selalu via `var()`.
2. `Pitch Green` hanya untuk aksi (CTA, vote, link aktif). Jangan untuk background besar.
3. Jaga kontras teks body `>= 4.5:1` di atas hitam.

---

## 3. Typography

### 3.1 Hasil `view-source` Aktual

Preload di `<head>`:

```html
<link href="/fonts/fc-27/CruyffSansCondensed-Regular.woff2" rel="preload" />
<link href="/fonts/fc-27/CruyffSansCondensed-Medium.woff2" rel="preload" />
<link href="/fonts/fc-27/CruyffSansExpanded-Heavy.woff2" rel="preload" />
```

`/fonts/fc-27/fonts.css`:

```css
@font-face {
  font-family: cruyffsansregular;
  font-weight: 400;
  src: url("/fonts/fc-27/CruyffSansCondensed-Regular.woff2");
}
@font-face {
  font-family: cruyffsanscondensed;
  font-weight: 500;
  src: url("/fonts/fc-27/CruyffSansCondensed-Medium.woff2");
}
@font-face {
  font-family: cruyffsansexpanded;
  font-weight: 900;
  src: url("/fonts/fc-27/CruyffSansExpanded-Heavy.woff2");
}
```

Plus font EA:
`ElectronicArtsDisplay-Light/Regular/Bold`, `ElectronicArtsText-Light/Regular/Bold + Italic`

### 3.2 Dua Keluarga Custom (F37 Foundry)

**1. Cruyff Sans — Headline / UI**

- Dinamai dari Johan Cruyff, terinspirasi `Cruyff turn` 60-derajat.
- Konstruksi grid segitiga + ink trap.
- Total 90 styles: back-slant + upright + italic × 6 weights + mono 5 weights. Support Latin, Arabic, Cyrillic, Greek.
- Varian FC PRO: slant digandakan 15° → 30° agar sejajar segitiga FC + alternates ekstra karakter.
- Dipakai untuk: `EA SPORTS FC 27`, `WELCOME TO THE WORLD'S GAME`, `STEP INTO THE GROUNDS`, nav `About / Features / News`, CTA.

**2. Marta Serif — Editorial**

- Dinamai dari Marta Silva, high-contrast, presisi, romantis.
- 4 weights + 2 italics.
- Dipakai untuk editorial / elevated brand moments, bukan untuk listing di halaman ini.

**3. EA Display / Text — Functional**

- Untuk chrome EA: footer legal, form newsletter, help, privacy. Netral agar tidak bentrok dengan Cruyff.

### 3.3 Skala & Gaya

| Level      | Font                         | Ukuran                        | Gaya                        |
| ---------- | ---------------------------- | ----------------------------- | --------------------------- |
| Hero H1    | Cruyff Expanded Heavy 900    | 64–96px, lh 0.9, tracking -2% | UPPERCASE                   |
| Section H2 | Cruyff Condensed Medium 500  | 32–48px                       | UPPERCASE                   |
| Card title | Cruyff Condensed Regular 400 | 16–20px                       | Sentence / Uppercase pendek |
| Meta/label | EA Text                      | 12–14px                       | UPPERCASE, grey             |
| Body       | EA Text / Cruyff Regular     | 15–17px, lh 1.6               | Regular                     |

Token tipografi:

```css
:root {
  --typography-font-heading: "cruyffsansexpanded", "Arial Narrow", sans-serif;
  --typography-font-body: "cuyffsanscondensed", "Arial Narrow", sans-serif;
  --typography-font-functional: "ElectronicArtsText", system-ui, sans-serif;
  --typography-heading-weight: 900;
  --typography-body-weight: 400;
  --typography-transform-heading: uppercase;
}
```

---

## 4. Adaptasi ke Aplikasi Voli (Rekomendasi)

PRD menuntut: sederhana, ringan, fungsional, input ≤2 detik, offline-first, optimal tablet/smartphone.

Jangan copy-paste dark gaming secara mentah (pelatih butuh keterbacaan siang hari di lapangan). Ambil spirit-nya:

- **Warna:** pertahankan netral terang untuk mode input (putih + abu stadion), pakai volt lime (`--fc-pitch-green`) hanya untuk aksi primer: `Catat Spike +`, `Simpan`, `Kirim WA`. Error tetap merah standar agar tidak ambigu dengan hijau lapangan.
- **Tipografi:** heading condensed uppercase untuk skor dan nama pemain (cepat di-scan), body netral system font agar ringan tanpa load woff2 besar. Jika butuh brand lokal, 1 display font cukup.
- **Komponen:** tiru pola card 16:9 untuk laporan JPEG (M-09), timeline log aksi seperti list News FC, dan lapangan interaktif 6 zona dengan kontras tinggi seperti keyart (zona sendiri vs lawan dibedakan terang-gelap).
- **Aksesibilitas:** target tap ≥44pt (penting untuk input real-time), fokus keyboard tidak tertutup sticky bar, sediakan pause untuk konten auto-rotate.

---

## 5. Referensi

- Halaman dianalisis: `ea.com/games/ea-sports-fc/fc-27`
- Brand story: Uncommon + EA (triangle hiding in plain sight)
- Type detail: `f37foundry.com/custom-fonts/eafc`
- Logo & palette story: GEMA, ESPN Apr 2023, Footy Headlines Apr 2023
