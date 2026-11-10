import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';
import { uploadImage, signedUrls } from '../lib/storage.js';
import { sendBookingCreated, sendBookingApproved } from '../lib/wa.js';
import * as settingsService from './settingsService.js';
import { generateCode, normalizePhone, computeAmounts, wibNow, wibToday, wibTimeNow } from './bookingPricing.js';

// play_date sebagai YYYY-MM-DD, bukan Date (pg mem-parse kolom date jadi Date lalu JSON jadi ISO)
const BOOKING_COLUMNS = `b.id, b.booking_code, b.customer_name, b.customer_phone, b.field_id,
  to_char(b.play_date, 'YYYY-MM-DD') as play_date, b.start_time, b.duration_hours, b.total_price, b.payment_type, b.dp_percentage,
  b.amount_due, b.remaining_amount, b.status, b.proof_url, b.proof_uploaded_at, b.rejection_reason,
  b.deadline_at, b.cancelled_by, b.cancellation_reason, b.is_walk_in, b.remaining_settled,
  b.created_at, b.updated_at, f.name as field_name`;

export function assertDateInWindow(playDate, settings) {
  const today = wibToday();
  if (playDate < today) throw new ApiError(422, 'Tanggal sudah lewat');

  const max = wibNow();
  max.setUTCDate(max.getUTCDate() + settings.booking_window_days);
  const maxYMD = `${max.getUTCFullYear()}-${String(max.getUTCMonth() + 1).padStart(2, '0')}-${String(max.getUTCDate()).padStart(2, '0')}`;
  if (playDate > maxYMD) {
    throw new ApiError(422, `Tanggal maksimal ${settings.booking_window_days} hari ke depan`);
  }
}

// Jam yang sudah lewat pada hari ini tidak bisa dipilih (PRD 5.2)
export function assertStartTimeNotPassed(playDate, startTime) {
  if (playDate === wibToday() && startTime <= wibTimeNow()) {
    throw new ApiError(422, 'Jam sudah lewat hari ini');
  }
}

function assertDateSelectable(playDate, startTime, settings) {
  assertDateInWindow(playDate, settings);
  assertStartTimeNotPassed(playDate, startTime);
}

// Walk-in boleh dimulai dari slot yang sedang berjalan, asal slot pertama belum selesai.
export function isWalkInSlotEnded(playDate, endTime, today = wibToday(), now = wibTimeNow()) {
  return playDate === today && endTime <= now;
}

async function assertFieldActive(fieldId) {
  const { rows } = await pool.query('select id from fields where id = $1 and is_active', [fieldId]);
  if (!rows[0]) throw new ApiError(422, 'Lapangan tidak tersedia');
}

// Ambil slot jam berurutan mulai dari start_time; seluruh slot harus aktif (PRD 5.1)
async function resolveSlots(startTime, durationHours) {
  const cursorStart = startTime.length === 5 ? `${startTime}:00` : startTime;
  const { rows } = await pool.query(
    `select id, start_time, end_time, price from time_slots
     where is_active and start_time >= $1::time order by start_time limit $2`,
    [cursorStart, durationHours],
  );

  const slots = [];
  let cursor = cursorStart;
  for (let i = 0; i < durationHours; i++) {
    const slot = rows.find((r) => r.start_time === cursor);
    if (!slot) throw new ApiError(422, 'Slot jam tidak tersedia');
    slots.push(slot);
    cursor = slot.end_time;
  }
  return slots;
}

// Ketersediaan untuk form pemesanan (PRD 8.2): semua slot aktif ditampilkan,
// yang sudah dipesan / sudah lewat hari ini ditandai is_available: false.
export async function availability(fieldId, date) {
  await assertFieldActive(fieldId);

  const { rows } = await pool.query(
    `select ts.id, ts.start_time, ts.end_time, ts.price, bs.id is not null as is_booked
     from time_slots ts
     left join booking_slots bs
       on bs.time_slot_id = ts.id and bs.field_id = $1 and bs.play_date = $2 and bs.is_active
     where ts.is_active
     order by ts.start_time`,
    [fieldId, date],
  );

  const today = wibToday();
  const cutoff = wibTimeNow();
  return rows.map((slot) => ({
    id: slot.id,
    start_time: slot.start_time,
    end_time: slot.end_time,
    price: slot.price,
    is_available: !slot.is_booked && !(date === today && slot.end_time <= cutoff),
  }));
}

// Insert booking + slot-nya dalam satu transaksi; retry sekali bila kode bentrok.
// 23505 pada booking_slots = anti double booking di level DB (PRD 5.2).
async function insertBooking(client, data, slots) {
  let row;
  for (let attempt = 0; ; attempt++) {
    try {
      const { rows } = await client.query(
        `insert into bookings (booking_code, customer_name, customer_phone, field_id, play_date,
           start_time, duration_hours, total_price, payment_type, dp_percentage,
           amount_due, remaining_amount, status, deadline_at, is_walk_in)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
           now() + interval '30 minutes', $14)
         returning booking_code`,
        [
          generateCode(), data.customer_name, data.customer_phone, data.field_id, data.play_date,
          slots[0].start_time, data.duration_hours, data.total_price, data.payment_type,
          data.dp_percentage, data.amount_due, data.remaining_amount, data.status, data.is_walk_in,
        ],
      );
      row = rows[0];
      break;
    } catch (err) {
      if (err.code === '23505' && attempt === 0) continue; // kode booking bentrok, coba sekali lagi
      throw err;
    }
  }

  await client.query(
    `insert into booking_slots (booking_id, field_id, time_slot_id, play_date, price)
     select b.id, $2, s.slot_id, $3, s.price
     from (select id from bookings where booking_code = $1) b,
          unnest($4::uuid[], $5::int[]) as s(slot_id, price)`,
    [row.booking_code, data.field_id, data.play_date, slots.map((s) => s.id), slots.map((s) => Number(s.price))],
  );
  return row.booking_code;
}

export async function create(input, { walkIn = false } = {}) {
  const settings = await settingsService.get();
  await assertFieldActive(input.field_id);
  if (walkIn) {
    assertDateInWindow(input.play_date, settings);
  } else {
    assertDateSelectable(input.play_date, input.start_time, settings);
  }

  const slots = await resolveSlots(input.start_time, input.duration_hours);
  if (walkIn && isWalkInSlotEnded(input.play_date, slots[0].end_time)) {
    throw new ApiError(422, 'Slot sudah selesai');
  }

  const total_price = slots.reduce((sum, s) => sum + Number(s.price), 0);
  const amounts = computeAmounts(total_price, walkIn ? 'full' : input.payment_type, settings.dp_percentage);

  const client = await pool.connect();
  let code;
  try {
    await client.query('begin');
    code = await insertBooking(client, {
      ...input,
      customer_phone: normalizePhone(input.customer_phone),
      total_price, ...amounts,
      status: walkIn ? 'PAID' : 'pending_payment',
      is_walk_in: walkIn,
    }, slots);
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    if (err.code === '23505') throw new ApiError(409, 'Slot sudah dipesan, pilih jam lain');
    throw err;
  } finally {
    client.release();
  }

  const booking = await get(code);
  if (!walkIn) sendBookingCreated(booking); // walk-in tidak kirim WA (PRD 7.2)
  return booking;
}

export async function get(bookingCode) {
  const { rows } = await pool.query(
    `select ${BOOKING_COLUMNS} from bookings b join fields f on f.id = b.field_id
     where b.booking_code = $1`,
    [bookingCode],
  );
  if (!rows[0]) throw new ApiError(404, 'Pesanan tidak ditemukan');

  const urls = await signedUrls(config.supabaseBucketProof, rows[0].proof_url ? [rows[0].proof_url] : []);
  return { ...rows[0], proof_signed_url: urls[rows[0].proof_url] ?? null };
}

// Lock baris booking di dalam transaksi; dipakai semua aksi perubahan status.
async function lockBooking(client, bookingCode) {
  const { rows } = await client.query(
    'select * from bookings where booking_code = $1 for update',
    [bookingCode],
  );
  if (!rows[0]) throw new ApiError(404, 'Pesanan tidak ditemukan');
  return rows[0];
}

const deactivateSlots = (client, bookingId) =>
  client.query('update booking_slots set is_active = false where booking_id = $1', [bookingId]);

function assertStatus(booking, expected) {
  if (booking.status !== expected) {
    throw new ApiError(409, `Status pesanan "${booking.status}", aksi ini butuh "${expected}"`);
  }
}

// ubah status + (opsional) bebaskan slot, dalam satu transaksi
async function runTransition(bookingCode, fn) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await fn(client, await lockBooking(client, bookingCode));
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
  return get(bookingCode);
}

// Customer unggah bukti (PRD 5.3): pending_payment → waiting_approval
export async function uploadProof(bookingCode, file) {
  // pra-cek: jangan buang file ke storage kalau statusnya memang tidak bisa menerima bukti
  const current = await get(bookingCode);
  assertStatus(current, 'pending_payment');

  const path = await uploadImage(config.supabaseBucketProof, file, 'proofs');
  return runTransition(bookingCode, async (client, booking) => {
    assertStatus(booking, 'pending_payment');
    await client.query(
      `update bookings set status = 'waiting_approval', proof_url = $1, proof_uploaded_at = now()
       where id = $2`,
      [path, booking.id],
    );
  });
}

// Customer batalkan sendiri (PRD 7.1)
export async function cancel(bookingCode, reason) {
  return runTransition(bookingCode, async (client, booking) => {
    assertStatus(booking, 'pending_payment');
    await client.query(
      `update bookings set status = 'cancelled', cancelled_by = 'customer',
         cancellation_reason = $1 where id = $2`,
      [reason || null, booking.id],
    );
    await deactivateSlots(client, booking.id);
  });
}

// Admin/staff Accept (PRD 9.3): waiting_approval → PAID + WA #2
export async function accept(bookingCode) {
  const result = await runTransition(bookingCode, async (client, booking) => {
    assertStatus(booking, 'waiting_approval');
    await client.query("update bookings set status = 'PAID' where id = $1", [booking.id]);
  });
  sendBookingApproved(result);
  return result;
}

// Admin/staff Reject (PRD 9.3): kembali ke pending_payment, timer diulang dari sekarang
export async function reject(bookingCode, reason) {
  return runTransition(bookingCode, async (client, booking) => {
    assertStatus(booking, 'waiting_approval');
    await client.query(
      `update bookings set status = 'pending_payment', rejection_reason = $1,
         deadline_at = now() + interval '30 minutes' where id = $2`,
      [reason, booking.id],
    );
  });
}

// Admin/staff Selesai (PRD 9.3): PAID → completed, catat pelunasan DP di tempat
export async function complete(bookingCode, remainingSettled) {
  return runTransition(bookingCode, async (client, booking) => {
    assertStatus(booking, 'PAID');
    await client.query(
      'update bookings set status = $1, remaining_settled = $2 where id = $3',
      ['completed', remainingSettled ?? false, booking.id],
    );
  });
}

// Admin/staff batalkan dengan alasan (PRD 9.3)
export async function adminCancel(bookingCode, reason, userId) {
  return runTransition(bookingCode, async (client, booking) => {
    if (!['pending_payment', 'PAID'].includes(booking.status)) {
      throw new ApiError(409, `Pesanan berstatus "${booking.status}" tidak bisa dibatalkan`);
    }
    await client.query(
      `update bookings set status = 'cancelled', cancelled_by = 'admin',
         cancellation_reason = $1, cancelled_by_user_id = $2 where id = $3`,
      [reason, userId, booking.id],
    );
    await deactivateSlots(client, booking.id);
  });
}

// page/limit dari query string; dipakai juga untuk offset & total_pages
export function resolvePage(page, limit) {
  const p = Math.max(1, Math.floor(Number(page) || 1));
  const l = Math.min(100, Math.max(1, Math.floor(Number(limit) || 20)));
  return { page: p, limit: l, offset: (p - 1) * l };
}

// List untuk halaman Pesanan & Jadwal admin (PRD 9.3, 9.4)
export async function list({ status, date, search, page, limit }) {
  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`b.status = $${values.length}`);
  }
  if (date) {
    values.push(date);
    conditions.push(`b.play_date = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    const i = values.length;
    // Nomor disimpan 62xxx, jadi "0812…" juga harus menemukan "62812…"
    const phone = normalizePhone(search);
    let phoneAlt = '';
    if (phone !== search) {
      values.push(`%${phone}%`);
      phoneAlt = ` or b.customer_phone ilike $${values.length}`;
    }
    conditions.push(
      `(b.customer_name ilike $${i} or b.customer_phone ilike $${i} or b.booking_code ilike $${i}${phoneAlt})`,
    );
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const paging = resolvePage(page, limit);

  // Count dan rows pakai WHERE yang sama supaya meta.total cocok dengan filter
  const [count, { rows }] = await Promise.all([
    pool.query(`select count(*)::int as total from bookings b ${where}`, values),
    pool.query(
      `select ${BOOKING_COLUMNS} from bookings b join fields f on f.id = b.field_id
       ${where}
       order by b.created_at desc, b.id desc
       limit $${values.length + 1} offset $${values.length + 2}`,
      [...values, paging.limit, paging.offset],
    ),
  ]);

  const total = count.rows[0].total;
  const urls = await signedUrls(config.supabaseBucketProof, rows.filter((r) => r.proof_url).map((r) => r.proof_url));
  return {
    rows: rows.map((row) => ({ ...row, proof_signed_url: urls[row.proof_url] ?? null })),
    meta: {
      page: paging.page,
      limit: paging.limit,
      total,
      total_pages: Math.ceil(total / paging.limit),
    },
  };
}

// Data CSV export (PRD 9.7, admin): rentang play_date + status.
// ponytail: batas 5000 baris, naikkan/pagination bila datanya membesar.
export async function exportList({ date_from, date_to, status }) {
  // Minimal satu filter supaya admin tidak sengaja menarik seluruh tabel
  if (!date_from && !date_to && !status) {
    throw new ApiError(422, 'Isi minimal satu filter (rentang tanggal atau status)');
  }

  const conditions = [];
  const values = [];

  if (date_from && date_to) {
    values.push(date_from, date_to);
    conditions.push(`b.play_date between $${values.length - 1} and $${values.length}`);
  } else if (date_from) {
    values.push(date_from);
    conditions.push(`b.play_date >= $${values.length}`);
  } else if (date_to) {
    values.push(date_to);
    conditions.push(`b.play_date <= $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`b.status = $${values.length}`);
  }

  const { rows } = await pool.query(
    `select b.booking_code,
            to_char(b.created_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') as booked_at,
            b.customer_name,
            b.customer_phone,
            f.name as field_name,
            to_char(b.play_date, 'YYYY-MM-DD') as play_date,
            to_char(b.start_time, 'HH24:MI') as start_time,
            to_char(b.start_time + make_interval(hours => b.duration_hours), 'HH24:MI') as end_time,
            b.total_price, b.payment_type, b.status
     from bookings b join fields f on f.id = b.field_id
     ${conditions.length ? `where ${conditions.join(' and ')}` : ''}
     order by b.play_date, b.start_time, b.booking_code
     limit 5000`,
    values,
  );

  return rows.map((r) => ({
    booking_code: r.booking_code,
    booked_at: r.booked_at,
    customer_name: r.customer_name,
    // 62xxx → 08xx untuk tampilan; kosong (walk-in) tetap kosong
    customer_phone: r.customer_phone?.startsWith('62') ? `0${r.customer_phone.slice(2)}` : r.customer_phone,
    field_name: r.field_name,
    play_date: r.play_date,
    play_time: `${r.start_time}-${r.end_time}`,
    total_price: r.total_price,
    payment_type: r.payment_type,
    status: r.status,
  }));
}

// Cron: batalkan pending_payment yang lewat deadline, bebaskan slot (PRD 5.4)
export async function expireOverdue() {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      `update bookings set status = 'cancelled', cancelled_by = 'system'
       where status = 'pending_payment' and deadline_at < now()
       returning id`,
    );
    let n = 0;
    if (rows.length) {
      await client.query('update booking_slots set is_active = false where booking_id = any($1::uuid[])', [
        rows.map((r) => r.id),
      ]);
      n = rows.length;
    }
    await client.query('commit');
    return n;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
