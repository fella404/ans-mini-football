import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import { pool } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { startBookingExpiryCron } from './jobs/expireBookings.js';
import { startSupabaseKeepaliveCron } from './jobs/supabaseKeepalive.js';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

// Serve hasil build frontend dari satu origin (deploy produksi): admin di /admin, website di /.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ADMIN_DIST = path.join(ROOT, 'admin-panel/dist');
const MAIN_DIST = path.join(ROOT, 'main-website/dist');
// Fallback SPA: route React dilayani index.html; dilewati di dev karena dist belum ada.
const sendIndex = (dist) => (req, res, next) =>
  res.sendFile(path.join(dist, 'index.html'), (err) => (err && !res.headersSent ? next() : next(err)));

app.use('/admin', express.static(ADMIN_DIST));
app.get(/^\/admin(\/|$)/, sendIndex(ADMIN_DIST));
app.use(express.static(MAIN_DIST));
app.get(/^(?!\/api(\/|$))\/.*/, sendIndex(MAIN_DIST));

app.use(notFound);
app.use(errorHandler);

try {
  await pool.query('select 1');
  console.log('Database terhubung');
} catch (err) {
  console.error('Gagal konek database:', err.message);
  process.exit(1);
}

startBookingExpiryCron();
startSupabaseKeepaliveCron();

app.listen(config.port, () => {
  console.log(`API jalan di http://localhost:${config.port}`);
});
