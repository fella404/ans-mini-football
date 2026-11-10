import { pool } from '../config/db.js';
import { config } from '../config/env.js';
import { signedUrls } from '../lib/storage.js';
import { wibToday } from './bookingPricing.js';
import { ApiError } from '../utils/ApiError.js';

const REVENUE_SQL = `case when b.status = 'completed' then b.total_price else b.amount_due end`;

// month "YYYY-MM" (WIB) dari query param; invalid/tidak ada = bulan berjalan
export function resolveMonth(monthParam) {
  if (!monthParam) return wibToday().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) throw new ApiError(422, 'Format bulan harus YYYY-MM');
  return monthParam;
}

export function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number);
  const start = `${ym}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate(); // hari terakhir bulan
  return { start, end: `${ym}-${String(lastDay).padStart(2, '0')}`, days: lastDay };
}

async function getStats(today) {
  const ym = today.slice(0, 7);
  const { start, end } = monthRange(ym);
  const { rows } = await pool.query(
    `select
       count(*) filter (where b.status = 'waiting_approval') as waiting_approval,
       count(*) filter (where b.play_date = $1 and b.status <> 'cancelled') as bookings_today,
       count(*) filter (where b.play_date between $2 and $3 and b.status in ('PAID', 'completed')) as bookings_this_month,
       coalesce(sum(${REVENUE_SQL}) filter (where b.play_date between $2 and $3 and b.status in ('PAID', 'completed')), 0) as revenue_this_month
     from bookings b`,
    [today, start, end],
  );
  const r = rows[0];
  return {
    waiting_approval: Number(r.waiting_approval),
    bookings_today: Number(r.bookings_today),
    bookings_this_month: Number(r.bookings_this_month),
    revenue_this_month: Number(r.revenue_this_month),
  };
}

// Satu baris per hari di bulan terpilih; hari tanpa pesanan tetap muncul (nilai 0) untuk sumbu-X Recharts
async function getDaily(ym) {
  const { start, end, days } = monthRange(ym);
  const { rows } = await pool.query(
    `select to_char(d.day, 'YYYY-MM-DD') as date,
            count(b.id) as bookings,
            coalesce(sum(${REVENUE_SQL}), 0) as revenue
     from generate_series($1::date, $2::date, interval '1 day') as d(day)
     left join bookings b
       on b.play_date = d.day and b.status in ('PAID', 'completed')
     group by d.day order by d.day`,
    [start, end],
  );
  // count(b.id) bisa null saat group, pastikan angka
  return rows.map((r) => ({
    date: r.date,
    bookings: Number(r.bookings ?? 0),
    revenue: Number(r.revenue ?? 0),
  }));
}

async function getTodaySchedule(today) {
  const { rows } = await pool.query(
    `select b.booking_code, b.customer_name, f.name as field_name,
            b.start_time, b.duration_hours, b.status
     from bookings b join fields f on f.id = b.field_id
     where b.play_date = $1 and b.status <> 'cancelled'
     order by b.start_time`,
    [today],
  );
  return rows;
}

async function getActionNeeded() {
  const { rows } = await pool.query(
    `select b.booking_code, b.customer_name, b.customer_phone, f.name as field_name,
            to_char(b.play_date, 'YYYY-MM-DD') as play_date, b.start_time,
            b.total_price, b.payment_type, b.status, b.proof_url, b.deadline_at
     from bookings b join fields f on f.id = b.field_id
     where b.status = 'waiting_approval'
     order by b.deadline_at asc limit 10`,
  );
  const urls = await signedUrls(config.supabaseBucketProof, rows.filter((r) => r.proof_url).map((r) => r.proof_url));
  return rows.map(({ proof_url, ...row }) => ({ ...row, proof_signed_url: urls[proof_url] ?? null }));
}

export async function getDashboard(monthParam) {
  const today = wibToday();
  const ym = resolveMonth(monthParam);

  const [stats, daily, today_schedule, action_needed] = await Promise.all([
    getStats(today),
    getDaily(ym),
    getTodaySchedule(today),
    getActionNeeded(),
  ]);

  return { stats, daily, today_schedule, action_needed };
}
