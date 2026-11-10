import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const COLUMNS = 'id, name, email, role, is_active, created_at, updated_at';
const DEFAULT_PASSWORD = '12345678';

export async function list() {
  const { rows } = await pool.query(
    `select ${COLUMNS} from users where role = 'staff' order by name`,
  );
  return rows;
}

export async function create(name, email) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let rows;
  try {
    ({ rows } = await pool.query(
      `insert into users (name, email, password_hash, role)
       values ($1, $2, $3, 'staff') returning ${COLUMNS}`,
      [name, email, passwordHash],
    ));
  } catch (err) {
    // 23505: email sudah dipakai user lain
    if (err.code === '23505') throw new ApiError(409, 'Email sudah digunakan');
    throw err;
  }
  return rows[0];
}

export async function update(id, patch) {
  const sets = [];
  const values = [];

  if (patch.name !== undefined) {
    values.push(patch.name);
    sets.push(`name = $${values.length}`);
  }
  if (patch.email !== undefined) {
    values.push(patch.email);
    sets.push(`email = $${values.length}`);
  }
  if (patch.is_active !== undefined) {
    values.push(patch.is_active);
    sets.push(`is_active = $${values.length}`);
  }
  if (sets.length === 0) throw new ApiError(422, 'Minimal kirim name, email, atau is_active');

  values.push(id);
  let rows;
  try {
    ({ rows } = await pool.query(
      `update users set ${sets.join(', ')}
       where id = $${values.length} and role = 'staff' returning ${COLUMNS}`,
      values,
    ));
  } catch (err) {
    if (err.code === '23505') throw new ApiError(409, 'Email sudah digunakan');
    throw err;
  }
  if (!rows[0]) throw new ApiError(404, 'Staff tidak ditemukan');
  return rows[0];
}

export async function remove(id) {
  const { rows } = await pool.query(
    `delete from users where id = $1 and role = 'staff' returning id`,
    [id],
  );
  if (!rows[0]) throw new ApiError(404, 'Staff tidak ditemukan');
}

export async function resetPassword(id) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const { rows } = await pool.query(
    `update users set password_hash = $1
     where id = $2 and role = 'staff' returning ${COLUMNS}`,
    [passwordHash, id],
  );
  if (!rows[0]) throw new ApiError(404, 'Staff tidak ditemukan');
  return rows[0];
}
