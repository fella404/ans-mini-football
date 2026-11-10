import { wibTimeNow, wibToday } from "./format.js";

export const slotKey = (fieldId, slotId) => `${fieldId}:${slotId}`;

export const buildOccupancyMap = (occupancy) =>
  new Map(occupancy.map((row) => [slotKey(row.field_id, row.time_slot_id), row]));

// Tanggal lampau dan slot yang sudah selesai hari ini dianggap lewat.
export const isSlotEnded = (date, endTime, today = wibToday(), now = wibTimeNow()) =>
  date < today || (date === today && endTime.slice(0, 5) <= now.slice(0, 5));

// Durasi 1-4 slot berurutan mulai dari startIndex; berhenti di slot yang
// terisi, nonaktif, atau sudah lewat. isSlotEnded menerima satu slot.
export function availableDurations({ slots, startIndex, occupiedSlotIds, isSlotEnded: ended }) {
  const durations = [];
  const max = Math.min(slots.length, startIndex + 4);
  for (let i = startIndex; i < max; i++) {
    const slot = slots[i];
    if (
      !slot.is_active ||
      occupiedSlotIds.has(slot.id) ||
      ended(slot) ||
      (i > startIndex && slot.start_time !== slots[i - 1].end_time)
    ) {
      break;
    }
    durations.push(i - startIndex + 1);
  }
  return durations;
}

export const totalPriceFor = (slots, startIndex, duration) =>
  slots
    .slice(startIndex, startIndex + duration)
    .reduce((sum, slot) => sum + Number(slot.price), 0);
