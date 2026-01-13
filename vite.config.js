import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: false, // Ini biar orang gak bisa intip kodingan asli kamu lewat Inspect Element
  },
});
