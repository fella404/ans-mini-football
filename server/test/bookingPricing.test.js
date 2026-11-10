import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCode, normalizePhone, computeAmounts, CODE_ALPHABET } from '../src/services/bookingPricing.js';

test('booking_code 8 karakter, tanpa karakter mudah tertukar', () => {
  const code = generateCode();
  assert.equal(code.length, 8);
  assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  assert.doesNotMatch(code, /[0OI1]/);
  for (const ch of code) assert.ok(CODE_ALPHABET.includes(ch));
});

test('normalizePhone: 08xx → 62xxx, sudah 62 dibiarkan, kosong → string kosong', () => {
  assert.equal(normalizePhone('081234567890'), '6281234567890');
  assert.equal(normalizePhone('6281234567890'), '6281234567890');
  assert.equal(normalizePhone(''), '');
  assert.equal(normalizePhone(undefined), '');
});

test('computeAmounts: full bayar total, dp bayar persentase dan sisanya di tempat', () => {
  assert.deepEqual(computeAmounts(500000, 'full', 50), {
    payment_type: 'full', dp_percentage: null, amount_due: 500000, remaining_amount: 0,
  });
  assert.deepEqual(computeAmounts(500000, 'dp', 50), {
    payment_type: 'dp', dp_percentage: 50, amount_due: 250000, remaining_amount: 250000,
  });
  // pembulatan: 300000 * 30% = 90000
  assert.equal(computeAmounts(300000, 'dp', 30).amount_due, 90000);
});
