import axios from "axios";

// JWT disimpan di cookie HTTP-only, jadi cookie harus ikut terkirim.
// VITE_API_URL diisi kalau API tidak berada di origin yang sama (mis. http://localhost:5000/api).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

export default api;
