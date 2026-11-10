import pg from 'pg';
import { config } from './env.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => console.error('pg pool error:', err.message));
