import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "client",
  },
  server: {
    host: true,
    strictPort: true,
    port: 4173,
    https: {
      cert: "./dott-pc.com.ar.crt",
      key: "./dott-pc.com.ar.key",
    },
  },
  preview: {
    host: true,
    strictPort: true,
    port: 4173,
    https: {
      cert: "./dott-pc.com.ar.crt",
      key: "./dott-pc.com.ar.key",
    },
  },
});
