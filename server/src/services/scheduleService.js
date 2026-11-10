import { pool } from '../config/db.js';
import { wibToday } from './bookingPricing.js';

export async function getSchedule(date = wibToday()) {
  const [fields, slots, occupancy] = await Promise.all([
    pool.query('select id, name, is_active from fields order by is_active desc, name'),
    pool.query('select id, start_time, end_time, price, is_active from time_slots order by start_time'),
    pool.query(
      `select bs.field_id, bs.time_slot_id, b.booking_code, b.customer_name, b.status,
              b.is_walk_in, b.start_time, b.duration_hours
       from booking_slots bs
       join bookings b on b.id = bs.booking_id
       where bs.play_date = $1 and bs.is_active and b.status <> 'cancelled'
       order by b.start_time`,
      [date],
    ),
  ]);

  return {
    date,
    fields: fields.rows,
    slots: slots.rows,
    occupancy: occupancy.rows,
  };
}
