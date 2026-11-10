import { create } from "zustand";
import api from "../lib/api";
import { wibMonth } from "../lib/format";

export const useDashboardStore = create((set, get) => ({
  data: null,
  month: wibMonth(),
  status: "idle", // idle | loading | done | error
  busy: false,
  error: "",

  load: async (month = get().month) => {
    set({ month, busy: true, error: "" });
    if (!get().data) set({ status: "loading" });

    try {
      const { data } = await api.get("/dashboard", { params: { month } });
      if (get().month !== month) return; // abaikan respons bulan yang sudah ditinggalkan
      set({ data: data.data, status: "done" });
    } catch (error) {
      set({
        status: get().data ? "done" : "error",
        error:
          error.response?.data?.message ??
          "Tidak bisa memuat data dashboard. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      set({ busy: false });
    }
  },

  refresh: () => get().load(get().month),
}));
