import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "login.html"),
        "edit-publikasi": resolve(__dirname, "edit-publikasi.html"),
        "edit-departemen": resolve(__dirname, "edit-departemen.html"),
        "edit-layanan": resolve(__dirname, "edit-layanan.html"),
      },
    },
  },
});