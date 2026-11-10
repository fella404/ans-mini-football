import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/db.js';

const migrationsDir = fileURLToPath(new URL('../migrations', import.meta.url));

await pool.query(`
  create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
const { rows } = await pool.query('select name from schema_migrations');
const applied = new Set(rows.map((row) => row.name));

for (const file of files) {
  if (applied.has(file)) continue;

  const sql = await readFile(path.join(migrationsDir, file), 'utf8');
  const client = await pool.connect();

  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('insert into schema_migrations (name) values ($1)', [file]);
    await client.query('commit');
    console.log(`applied ${file}`);
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

await pool.end();
console.log('migrasi selesai');
