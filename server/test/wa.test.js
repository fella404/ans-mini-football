import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.FONNTE_TOKEN = 'test-token';

const { sendBookingCreated, sendBookingApproved } = await import('../src/lib/wa.js');

function stubFetch() {
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, opts });
    return { ok: true, status: 200, json: async () => ({ status: true }) };
  };
  return calls;
}

const booking = {
  booking_code: 'ABCD2345',
  customer_name: 'Budi',
  customer_phone: '6281234567890',
  field_name: 'Lapangan 1',
  play_date: '2026-11-08',
  start_time: '19:00:00',
  duration_hours: 2,
  total_price: 500000,
  amount_due: 250000,
  remaining_amount: 250000,
  payment_type: 'dp',
};

test('WA #1: POST ke api.fonnte.com/send, header Authorization tanpa Bearer, body form-urlencoded', async () => {
  const calls = stubFetch();
  await sendBookingCreated(booking);

  assert.equal(calls.length, 1);
  const { url, opts } = calls[0];
  assert.equal(url, 'https://api.fonnte.com/send');
  assert.equal(opts.method, 'POST');
  assert.equal(opts.headers.Authorization, 'test-token'); // bukan "Bearer test-token"
  assert.ok(opts.body instanceof URLSearchParams);
  assert.equal(opts.body.get('target'), '6281234567890');
  assert.match(opts.body.get('message'), /ABCD2345/);
});

test('WA #2: menyertakan sisa pembayaran untuk DP', async () => {
  const calls = stubFetch();
  await sendBookingApproved(booking);
  assert.match(calls[0].opts.body.get('message'), /Sisa pembayaran.*250\.000/);
});

test('tanpa nomor (walk-in) tidak memanggil gateway', async () => {
  const calls = stubFetch();
  await sendBookingCreated({ ...booking, customer_phone: '' });
  assert.equal(calls.length, 0);
});
