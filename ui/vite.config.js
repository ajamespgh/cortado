import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "ui",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/workspace": "http://127.0.0.1:4317", "/analyze": "http://127.0.0.1:4317", "/file": "http://127.0.0.1:4317", "/rename": "http://127.0.0.1:4317" }
  }
});
