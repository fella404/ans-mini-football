import { test } from "node:test";
import assert from "node:assert/strict";
import { endJam } from "./format.js";

test("endJam: jam mulai + durasi", () => {
  assert.equal(endJam("19:00:00", 2), "21:00");
  assert.equal(endJam("19:00:00", 1), "20:00");
});

test("endJam: lewat tengah malam", () => {
  assert.equal(endJam("23:00:00", 2), "01:00");
});

test("endJam: durasi nol", () => {
  assert.equal(endJam("20:00:00", 0), "20:00");
});
