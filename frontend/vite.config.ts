import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: "./", // Importante para Electron: usar rutas relativas
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
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
  },
  server: {
    host: true,
    port: 5175,
    hmr: {
      overlay: mode === "development", // Solo en desarrollo
    },
  },
  build: {
    sourcemap: mode === "development", // Solo en desarrollo
    minify: mode === "production", // Solo en producción
    modulePreload: {
      polyfill: true, // Añade un polyfill para navegadores más antiguos
      resolveDependencies: (_, deps) => {
        // Personaliza qué módulos se precargan
        return deps;
      },
    },
    rollupOptions: {
      output: {
        // Configuración manual de chunks comentada temporalmente
        /*
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('rxdb') || id.includes('dexie')) {
              return 'vendor-rxdb';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('crypto-js') || id.includes('jose')) {
              return 'vendor-crypto';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-other';
          }
          
          // Feature-based chunks
          if (id.includes('/features/inventory/')) {
            return 'feature-inventory';
          }
          if (id.includes('/features/sales/')) {
            return 'feature-sales';
          }
          if (id.includes('/features/purchases/')) {
            return 'feature-purchases';
          }
          if (id.includes('/features/users/')) {
            return 'feature-users';
          }
          if (id.includes('/features/clients/')) {
            return 'feature-clients';
          }
          if (id.includes('/features/reports/')) {
            return 'feature-reports';
          }
          
          // Shared utilities
          if (id.includes('/shared/')) {
            return 'shared';
          }
        },
        */
      },
    },
  },
}));
