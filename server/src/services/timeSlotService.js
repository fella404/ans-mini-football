import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const COLUMNS = 'id, start_time, end_time, price, is_active, created_at, updated_at';

const normalizeTime = (time) => (time.length === 5 ? `${time}:00` : time);

function assertRange(startTime, endTime) {
  if (normalizeTime(endTime) <= normalizeTime(startTime)) {
    throw new ApiError(422, 'Jam selesai harus setelah jam mulai');
  }
}

// 23514 = check constraint rentang, 23505 = unique (start_time, end_time)
function mapWriteError(err) {
  if (err.code === '23514') return new ApiError(422, 'Jam selesai harus setelah jam mulai');
  if (err.code === '23505') return new ApiError(409, 'Slot jam dengan rentang tersebut sudah ada');
  return err;
}

export async function listActive() {
  const { rows } = await pool.query(
    `select ${COLUMNS} from time_slots where is_active order by start_time`,
  );
  return rows;
}

export async function listAll() {
  const { rows } = await pool.query(`select ${COLUMNS} from time_slots order by start_time`);
  return rows;
}

export async function create({ start_time, end_time, price, is_active }) {
  assertRange(start_time, end_time);

  try {
    const { rows } = await pool.query(
      `insert into time_slots (start_time, end_time, price, is_active)
       values ($1, $2, $3, coalesce($4, true)) returning ${COLUMNS}`,
      [start_time, end_time, price, is_active],
    );
    return rows[0];
  } catch (err) {
    throw mapWriteError(err);
  }
}

export async function update(id, patch) {
  const provided = ['start_time', 'end_time', 'price', 'is_active'].filter(
    (key) => patch[key] !== undefined,
  );
  if (provided.length === 0) throw new ApiError(422, 'Minimal kirim salah satu field slot jam');

  // Validasi hasil akhir, bukan hanya field yang dikirim.
  if (patch.start_time !== undefined || patch.end_time !== undefined) {
    const { rows } = await pool.query('select start_time, end_time from time_slots where id = $1', [id]);
    if (!rows[0]) throw new ApiError(404, 'Slot jam tidak ditemukan');
    assertRange(patch.start_time ?? rows[0].start_time, patch.end_time ?? rows[0].end_time);
  }

  const sets = [];
  const values = [];
  for (const key of provided) {
    values.push(patch[key]);
    sets.push(`${key} = $${values.length}`);
  }

  values.push(id);
  try {
    const { rows } = await pool.query(
      `update time_slots set ${sets.join(', ')} where id = $${values.length} returning ${COLUMNS}`,
      values,
    );
    if (!rows[0]) throw new ApiError(404, 'Slot jam tidak ditemukan');
    return rows[0];
  } catch (err) {
    throw mapWriteError(err);
  }
}

export async function remove(id) {
  let rows;
  try {
    ({ rows } = await pool.query('delete from time_slots where id = $1 returning id', [id]));
  } catch (err) {
    // 23503: masih direferensikan booking_slots
    if (err.code === '23503') {
      throw new ApiError(409, 'Slot jam sudah dipakai pesanan; nonaktifkan saja');
    }
    throw err;
  }
  if (!rows[0]) throw new ApiError(404, 'Slot jam tidak ditemukan');
}
