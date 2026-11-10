import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // Admin disajikan backend di path /admin (deploy satu origin), jadi asset harus ikut base ini.
  // Di dev URL-nya jadi http://localhost:5174/admin/ (restart `npm run dev` setelah ubah ini).
  base: "/admin/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: { proxy: { "/api": "http://localhost:3000" } },
});
