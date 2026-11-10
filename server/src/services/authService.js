import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../lib/token.js';

export async function login(email, password) {
  const { rows } = await pool.query(
    'select id, name, email, password_hash, role, is_active from users where email = $1',
    [email.toLowerCase()],
  );
  const user = rows[0];

  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'Email atau password salah');
  }

  return {
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function changePassword(userId, oldPassword, newPassword) {
  const { rows } = await pool.query('select password_hash from users where id = $1', [userId]);
  if (!rows[0]) throw new ApiError(404, 'User tidak ditemukan');

  if (!(await bcrypt.compare(oldPassword, rows[0].password_hash))) {
    throw new ApiError(401, 'Password lama salah');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query('update users set password_hash = $1 where id = $2', [passwordHash, userId]);
}
