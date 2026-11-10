import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePaging } from "./paging.js";

const parse = (query) => parsePaging(new URLSearchParams(query));

test("parsePaging: default halaman 1 limit 10", () => {
  assert.deepEqual(parse(""), { page: 1, limit: 10 });
});

test("parsePaging: membaca page & limit dari URL", () => {
  assert.deepEqual(parse("page=3&limit=50"), { page: 3, limit: 50 });
});

test("parsePaging: nilai asing jatuh ke default", () => {
  assert.deepEqual(parse("page=abc&limit=999"), { page: 1, limit: 10 });
  assert.deepEqual(parse("page=0&limit=0"), { page: 1, limit: 10 });
  assert.deepEqual(parse("page=-2&limit=7"), { page: 1, limit: 10 });
});

test("parsePaging: desimal dipotong", () => {
  assert.deepEqual(parse("page=2.9"), { page: 2, limit: 10 });
});
