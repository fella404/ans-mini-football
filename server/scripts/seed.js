import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';
import { config } from '../src/config/env.js';
import { uploadImage, publicUrl } from '../src/lib/storage.js';

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@ansminifootball.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? '12345678';

const passwordHash = await bcrypt.hash(adminPassword, 10);
await pool.query(
  `insert into users (name, email, password_hash, role)
   values ($1, $2, $3, 'admin')
   on conflict (email) do nothing`,
  ['Admin', adminEmail, passwordHash],
);

for (const name of ['Lapangan 1', 'Lapangan 2']) {
  await pool.query(
    `insert into fields (name)
     select $1 where not exists (select 1 from fields where name = $1)`,
    [name],
  );
}

// Tarif per jam sesuai PRD 5.1 (silakan ubah angkanya di sini)
const priceFor = (hour) => {
  if (hour < 16) return 150000;
  if (hour < 18) return 200000;
  if (hour < 22) return 250000;
  return 200000;
};

for (let hour = 5; hour < 24; hour++) {
  const start = `${String(hour).padStart(2, '0')}:00:00`;
  const end = `${String(hour + 1).padStart(2, '0')}:00:00`;
  await pool.query(
    `insert into time_slots (start_time, end_time, price)
     values ($1, $2, $3)
     on conflict (start_time, end_time) do nothing`,
    [start, end, priceFor(hour)],
  );
}

await pool.query('insert into settings (id) values (1) on conflict (id) do nothing');

// Data settings contoh (isi hanya yang masih kosong; ubah lewat halaman Pengaturan)
await pool.query(
  `update settings set
     dp_percentage = coalesce(dp_percentage, 50),
     booking_window_days = coalesce(booking_window_days, 30),
     bank_name = coalesce(bank_name, 'BCA'),
     bank_account_number = coalesce(bank_account_number, '1234567890'),
     bank_account_holder = coalesce(bank_account_holder, 'ANS Mini Football')
   where id = 1`,
);

// QRIS contoh: unduh QR acak dari api.qrserver.com, upload ke bucket public-assets
const { rows: settingsRows } = await pool.query('select qris_image_url from settings where id = 1');
if (!settingsRows[0]?.qris_image_url) {
  const res = await fetch('https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=ANS-MINI-FOOTBALL');
  if (!res.ok) throw new Error(`Gagal unduh QR contoh: HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const path = await uploadImage(config.supabaseBucketPublic, { buffer, mimetype: 'image/png', size: buffer.length }, 'qris');
  await pool.query('update settings set qris_image_url = $1 where id = 1', [publicUrl(config.supabaseBucketPublic, path)]);
  console.log('QRIS contoh diunggah ke', path);
}

await pool.end();
console.log(`seed selesai (admin: ${adminEmail} / ${adminPassword})`);
