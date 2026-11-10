import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertDateInWindow,
  assertStartTimeNotPassed,
  isWalkInSlotEnded,
} from '../src/services/bookingService.js';

test('walk-in hari ini pada slot yang sedang berjalan: boleh', () => {
  assert.equal(isWalkInSlotEnded('2026-11-07', '20:00:00', '2026-11-07', '19:15:00'), false);
});

test('walk-in hari ini pada slot yang sudah selesai: ditolak', () => {
  assert.equal(isWalkInSlotEnded('2026-11-07', '20:00:00', '2026-11-07', '20:05:00'), true);
});

test('walk-in tanggal lampau ditolak assertDateInWindow', () => {
  assert.throws(() => assertDateInWindow('2000-01-01', { booking_window_days: 30 }), /Tanggal sudah lewat/);
});

test('pesanan customer biasa pada jam lewat hari ini tetap ditolak', () => {
  const today = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Jakarta',
  }).format(new Date());
  assert.throws(() => assertStartTimeNotPassed(today, '00:00'), /Jam sudah lewat/);
});
