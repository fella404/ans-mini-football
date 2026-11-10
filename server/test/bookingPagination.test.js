import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePage } from '../src/services/bookingService.js';

test('resolvePage: default halaman 1 limit 20', () => {
  assert.deepEqual(resolvePage(undefined, undefined), { page: 1, limit: 20, offset: 0 });
});

test('resolvePage: offset mengikuti halaman dan limit', () => {
  assert.deepEqual(resolvePage('3', '50'), { page: 3, limit: 50, offset: 100 });
});

test('resolvePage: nilai tidak valid / di luar batas dijepit', () => {
  assert.equal(resolvePage('0', '0').page, 1);
  assert.equal(resolvePage('abc', 'abc').page, 1);
  assert.equal(resolvePage('2', '500').limit, 100);
  assert.equal(resolvePage('2', '-5').limit, 1);
  assert.equal(resolvePage('2.9', '20').page, 2);
});
