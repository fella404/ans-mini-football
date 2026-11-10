import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthRange, resolveMonth } from '../src/services/dashboardService.js';

test('monthRange: rentang & jumlah hari benar, termasuk tahun kabisat', () => {
  assert.deepEqual(monthRange('2026-11'), { start: '2026-11-01', end: '2026-11-30', days: 30 });
  assert.deepEqual(monthRange('2026-02'), { start: '2026-02-01', end: '2026-02-28', days: 28 });
  assert.deepEqual(monthRange('2024-02'), { start: '2024-02-01', end: '2024-02-29', days: 29 }); // kabisat
  assert.deepEqual(monthRange('2026-01'), { start: '2026-01-01', end: '2026-01-31', days: 31 });
});

test('resolveMonth: valid diterima, invalid dilempar 422', () => {
  assert.equal(resolveMonth('2026-03'), '2026-03');
  assert.throws(() => resolveMonth('2026-13'), /Format bulan/);
  assert.throws(() => resolveMonth('2026-3'), /Format bulan/);
  assert.throws(() => resolveMonth('November'), /Format bulan/);
});
