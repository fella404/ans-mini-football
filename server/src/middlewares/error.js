import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    data: null,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.status ?? 500;
  let message = err.message ?? 'Internal server error';

  if (err.code === '23505') {
    status = 409;
    message = 'Data sudah ada (konflik).';
  } else if (err.code === '23503') {
    status = 409;
    message = 'Data masih dipakai oleh data lain.';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 422;
    message = 'Ukuran file maksimal 2 MB.';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    data: err instanceof ApiError ? err.data : null,
    message: status >= 500 ? 'Internal server error' : message,
  });
}
