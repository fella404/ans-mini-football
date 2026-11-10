import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availableDurations,
  buildOccupancyMap,
  isSlotEnded,
  slotKey,
  totalPriceFor,
} from "./schedule.js";

const slots = [
  { id: "a", start_time: "19:00:00", end_time: "20:00:00", price: 250000, is_active: true },
  { id: "b", start_time: "20:00:00", end_time: "21:00:00", price: 250000, is_active: true },
  { id: "c", start_time: "21:00:00", end_time: "22:00:00", price: 300000, is_active: true },
  { id: "d", start_time: "22:00:00", end_time: "23:00:00", price: 300000, is_active: true },
  { id: "e", start_time: "23:00:00", end_time: "00:00:00", price: 300000, is_active: true },
];

const never = () => false;
const options = (extra = {}) => ({
  slots,
  startIndex: 0,
  occupiedSlotIds: new Set(),
  isSlotEnded: never,
  ...extra,
});

test("availableDurations: berhenti di slot terisi", () => {
  assert.deepEqual(availableDurations(options({ occupiedSlotIds: new Set(["c"]) })), [1, 2]);
});

test("availableDurations: maksimal 4", () => {
  assert.deepEqual(availableDurations(options()), [1, 2, 3, 4]);
});

test("availableDurations: berhenti di slot lewat", () => {
  assert.deepEqual(availableDurations(options({ isSlotEnded: (s) => s.id === "b" })), [1]);
});

test("availableDurations: berhenti di slot nonaktif", () => {
  const slotsMixed = slots.map((s) => (s.id === "b" ? { ...s, is_active: false } : s));
  assert.deepEqual(
    availableDurations(options({ slots: slotsMixed })),
    [1],
  );
});

test("availableDurations: berhenti saat jam tidak berurutan", () => {
  const gapped = slots.map((s) => (s.id === "b" ? { ...s, start_time: "20:30:00" } : s));
  assert.deepEqual(availableDurations(options({ slots: gapped })), [1]);
});

test("totalPriceFor: jumlah tarif slot terpilih", () => {
  assert.equal(totalPriceFor(slots, 0, 3), 800000);
  assert.equal(totalPriceFor(slots, 3, 1), 300000);
});

test("isSlotEnded: tanggal lampau selalu lewat", () => {
  assert.equal(isSlotEnded("2026-11-06", "23:00:00", "2026-11-07", "10:00:00"), true);
});

test("isSlotEnded: hari ini slot selesai lewat, slot berjalan belum", () => {
  assert.equal(isSlotEnded("2026-11-07", "20:00:00", "2026-11-07", "20:05:00"), true);
  assert.equal(isSlotEnded("2026-11-07", "20:00:00", "2026-11-07", "19:15:00"), false);
});

test("buildOccupancyMap: key gabungan lapangan & slot", () => {
  const map = buildOccupancyMap([{ field_id: "f1", time_slot_id: "a", booking_code: "X" }]);
  assert.equal(map.get(slotKey("f1", "a")).booking_code, "X");
});
