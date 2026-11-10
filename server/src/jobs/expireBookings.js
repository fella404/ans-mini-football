import cron from 'node-cron';
import * as bookingService from '../services/bookingService.js';

// Cek tiap 1 menit: pending_payment yang lewat deadline → cancelled (PRD 5.4)
export function startBookingExpiryCron() {
  cron.schedule('* * * * *', async () => {
    try {
      const n = await bookingService.expireOverdue();
      if (n) console.log(`cron: ${n} pesanan kedaluwarsa dibatalkan`);
    } catch (err) {
      console.error('cron gagal:', err.message);
    }
  });
}
