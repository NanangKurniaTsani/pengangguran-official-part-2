import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite"; // Tambahkan ini

export default defineConfig({
  plugins: [
    tailwindcss(), // Tambahkan ini agar Vite mengurus Tailwind kamu
  ],
  build: {
    sourcemap: false, // Tetap jaga privasi kode kamu
  },
});