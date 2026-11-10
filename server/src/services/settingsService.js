import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadImage, publicUrl, removeObject } from '../lib/storage.js';
import { config } from '../config/env.js';

const COLUMNS =
  'id, dp_percentage, booking_window_days, bank_name, bank_account_number, bank_account_holder, qris_image_url, updated_at, updated_by';

export async function get() {
  const { rows } = await pool.query(`select ${COLUMNS} from settings where id = 1`);
  if (rows[0]) return rows[0];

  // baris singleton mungkin belum di-seed
  await pool.query('insert into settings (id) values (1) on conflict (id) do nothing');
  const fresh = await pool.query(`select ${COLUMNS} from settings where id = 1`);
  return fresh.rows[0];
}

export async function update(patch, userId) {
  const sets = [];
  const values = [];

  for (const key of ['dp_percentage', 'booking_window_days', 'bank_name', 'bank_account_number', 'bank_account_holder']) {
    if (patch[key] !== undefined) {
      values.push(patch[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (sets.length === 0) throw new ApiError(422, 'Minimal kirim salah satu field pengaturan');

  values.push(userId);
  sets.push(`updated_by = $${values.length}`);
  values.push(1);

  const { rows } = await pool.query(
    `update settings set ${sets.join(', ')} where id = $${values.length} returning ${COLUMNS}`,
    values,
  );
  if (!rows[0]) throw new ApiError(404, 'Pengaturan tidak ditemukan');
  return rows[0];
}

export async function setQris(file) {
  const current = await get();
  if (current.qris_image_url) {
    // buang file lama supaya bucket tidak menumpuk sampah
    const oldPath = current.qris_image_url.split(`/${config.supabaseBucketPublic}/`)[1];
    if (oldPath) await removeObject(config.supabaseBucketPublic, oldPath);
  }

  const path = await uploadImage(config.supabaseBucketPublic, file, 'qris');
  const url = publicUrl(config.supabaseBucketPublic, path);

  const { rows } = await pool.query(
    `update settings set qris_image_url = $1 where id = 1 returning ${COLUMNS}`,
    [url],
  );
  return rows[0];
}
