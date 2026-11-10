import cron from 'node-cron';
import { pool } from '../config/db.js';

// Supabase free plan mem-pause project setelah 7 hari tanpa aktivitas.
// Query ringan tiap 3 hari pukul 04:00 WIB; hanya jalan saat server Express hidup.
export async function keepAlive() {
  try {
    await pool.query('select 1');
    console.log('cron: keepalive supabase ok');
  } catch (err) {
    console.error('cron keepalive gagal:', err.message);
  }
}

export function startSupabaseKeepaliveCron() {
  cron.schedule('0 4 */3 * *', keepAlive, { timezone: 'Asia/Jakarta' });
}
