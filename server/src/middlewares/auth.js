import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) throw new ApiError(401, 'Belum login');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new ApiError(401, 'Sesi tidak valid atau kedaluwarsa');
  }

  const { rows } = await pool.query(
    'select id, name, email, role, is_active from users where id = $1',
    [payload.sub],
  );
  if (!rows[0]?.is_active) throw new ApiError(401, 'Akun tidak aktif');

  req.user = rows[0];
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new ApiError(403, 'Akses ditolak');
    next();
  };
}
