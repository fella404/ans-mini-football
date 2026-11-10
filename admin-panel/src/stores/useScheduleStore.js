import { create } from "zustand";
import api from "../lib/api";

// Naik tiap request; respons tanggal lama yang datang terlambat diabaikan.
let requestId = 0;

export const useScheduleStore = create((set, get) => ({
  date: "",
  data: null, // { date, fields, slots, occupancy }
  status: "idle", // idle | loading | done | error
  busy: false,
  error: "",

  load: async (date = get().date) => {
    const id = ++requestId;
    const changed = date !== get().date;
    const empty = !get().data;

    set({
      date,
      busy: true,
      error: "",
      ...(changed || empty ? { data: null, status: "loading" } : {}),
    });

    try {
      const { data } = await api.get("/schedule", { params: { date } });
      if (id !== requestId) return;
      set({ data: data.data, status: "done" });
    } catch (error) {
      if (id !== requestId) return;
      set({
        status: get().data ? "done" : "error",
        error:
          error.response?.data?.message ??
          "Tidak bisa memuat jadwal. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      if (id === requestId) set({ busy: false });
    }
  },

  refresh: () => get().load(get().date),
}));
