import { create } from "zustand";
import api from "../lib/api";

// status: idle -> belum cek sesi, loading -> sedang cek, authenticating -> login, done -> selesai.
export const useAuthStore = create((set, get) => ({
  user: null,
  status: "idle",

  login: async (email, password) => {
    set({ status: "authenticating" });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      set({ user: data.data, status: "done" });
    } finally {
      set({ status: "done" });
    }
  },

  fetchMe: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.data });
    } catch {
      set({ user: null });
    } finally {
      set({ status: "done" });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null, status: "done" });
    }
  },
}));
