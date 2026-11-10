import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../src/lib/csv.js';

test('toCsv: nilai biasa dipisah koma, baris CRLF, diawali BOM', () => {
  const csv = toCsv(['a', 'b'], [['1', '2']]);
  assert.equal(csv, '\uFEFFa,b\r\n1,2\r\n');
});

test('toCsv: koma, kutip, dan newline dibungkus kutip + kutip digandakan', () => {
  const csv = toCsv(['h'], [['kata, koma'], ['dia "bilang"'], ['baris\nbaru']]);
  assert.equal(csv, '\uFEFFh\r\n"kata, koma"\r\n"dia ""bilang"""\r\n"baris\nbaru"\r\n');
});

test('toCsv: formula injection diprefix apostrof', () => {
  const csv = toCsv(['h'], [['=SUM(A1)'], ['+1'], ['-2'], ['@cmd']]);
  assert.equal(csv, '\uFEFFh\r\n\'=SUM(A1)\r\n\'+1\r\n\'-2\r\n\'@cmd\r\n');
});

test('toCsv: null dan undefined menjadi string kosong', () => {
  const csv = toCsv(['a', 'b'], [[null, undefined]]);
  assert.equal(csv, '\uFEFFa,b\r\n,\r\n');
});
