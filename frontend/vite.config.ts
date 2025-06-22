import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    exclude: ["jose"],
  },
  server: {
    host: true,
    hmr: {
      overlay: mode === "development", // Solo en desarrollo
    },
  },
  build: {
    sourcemap: mode === "development", // Solo en desarrollo
    minify: mode === "production", // Solo en producción
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          rxdb: ["rxdb", "dexie"],
          firebase: ["firebase/app", "firebase/firestore"],
          crypto: ["crypto-js", "jose"],
        },
      },
    },
  },
}));
