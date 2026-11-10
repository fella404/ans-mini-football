import { create } from "zustand";
import api from "../lib/api";

const keyOf = (filters) =>
  JSON.stringify([filters.status, filters.date, filters.search, filters.limit]);

// Naik tiap request; respons lama yang datang terlambat diabaikan.
let requestId = 0;

export const useBookingsStore = create((set, get) => ({
  rows: [],
  filters: { status: "", date: "", search: "", page: 1, limit: 10 },
  meta: { page: 1, limit: 10, total: 0, total_pages: 1 },
  status: "idle", // idle | loading | done | error
  busy: false,
  error: "",

  load: async (filters = get().filters) => {
    const id = ++requestId;
    const current = get().filters;
    const next = {
      status: filters.status ?? "",
      date: filters.date ?? "",
      search: filters.search ?? "",
      limit: filters.limit ?? current.limit,
      page: filters.page ?? current.page,
    };
    const empty = get().rows.length === 0;
    const changed = keyOf(next) !== keyOf(current);
    // Halaman datang dari URL; reset ke 1 saat filter berubah diurus pemanggil.
    const page = next.page;

    set({
      filters: { ...next, page },
      busy: true,
      error: "",
      ...(changed || empty ? { rows: [], status: "loading" } : {}),
    });

    const params = { limit: next.limit };
    if (next.status) params.status = next.status;
    if (next.date) params.date = next.date;
    if (next.search) params.search = next.search;
    if (page > 1) params.page = page;

    try {
      const { data } = await api.get("/bookings", { params });
      if (id !== requestId) return;
      set({ rows: data.data, meta: data.meta, status: "done" });
    } catch (error) {
      if (id !== requestId) return;
      set({
        status: get().rows.length ? "done" : "error",
        error:
          error.response?.data?.message ??
          "Tidak bisa memuat pesanan. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      if (id === requestId) set({ busy: false });
    }
  },

  refresh: () => get().load(get().filters),

  // Aksi dialog mengembalikan booking terbaru → update baris tanpa menunggu refetch.
  patchRow: (code, data) =>
    set({
      rows: get().rows.map((r) =>
        r.booking_code === code ? { ...r, ...data } : r,
      ),
    }),
}));
