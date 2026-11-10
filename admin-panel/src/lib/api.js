import axios from "axios";

const api = axios.create({
  // Default "/api": dev lewat proxy vite, produksi satu origin dengan backend.
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

export default api;
