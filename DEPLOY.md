# Deploy (Render, gratis)

Satu layanan Render menjalankan **backend Express + kedua frontend** dalam satu origin:

- `/` → main-website (customer)
- `/admin` → admin-panel
- `/api` → API

Satu origin = cookie JWT (`sameSite=lax`) tetap valid, jadi login aman di semua browser tanpa ubah kode auth.

## 1. Push ke GitHub

```bash
git init
git add .
git commit -m "siap deploy"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## 2. Buat Web Service di Render

New → Web Service → hubungkan repo. Isi:

| Field | Nilai |
|---|---|
| Language/Runtime | Node |
| Build Command | `npm ci --prefix server && npm ci --prefix main-website && npm run build --prefix main-website && npm ci --prefix admin-panel && npm run build --prefix admin-panel` |
| Start Command | `node server/src/index.js` |
| Instance Type | Free |

Frontend di-build tanpa env tambahan: `baseURL` API default `/api` (satu origin).

## 3. Environment Variables

Isi di tab Environment (lihat `server/.env.example` untuk daftar lengkap):

| Key | Nilai |
|---|---|
| `DATABASE_URL` | connection string Supabase **Pooler port 6543** (bukan Direct 5432) |
| `JWT_SECRET` | string acak panjang |
| `NODE_ENV` | `production` |
| `APP_URL` | `https://<nama>.onrender.com` |
| `CORS_ORIGIN` | `https://<nama>.onrender.com` |
| `SUPABASE_URL` | dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | dari Supabase |
| `FONNTE_TOKEN` | opsional |

Skema DB sudah ada di Supabase, tidak perlu migrasi. Upload bukti bayar & QRIS masuk ke Supabase Storage (bukan disk lokal), jadi aman di filesystem ephemeral Render.

## 4. Cek setelah deploy

```bash
curl -i https://<nama>.onrender.com/          # 200, halaman customer
curl -i https://<nama>.onrender.com/admin     # 200, halaman admin
curl -i https://<nama>.onrender.com/api/health # 200 {"status":"ok"}
```

## 5. Cegah tidur (wajib untuk free tier)

Free tier Render tidur setelah 15 menit tanpa trafik → cold start 30–60 detik.
Buat monitor gratis di [cron-job.org](https://cron-job.org) yang memanggil
`https://<nama>.onrender.com/api/health` tiap 10 menit.

Ini sekaligus menjaga cron di dalam server tetap jalan (expiry booking & keepalive
Supabase yang hanya aktif saat server hidup).
