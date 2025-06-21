import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { store } from "./shared/store/store";
import { initSecurity } from "./shared/config/security";
import { initDatabaseAndModels } from "./shared/db/database";
import { checkAndInitializeData } from "./shared/utils/init-data.utils";

// Mostrar información de configuración en desarrollo
import "./shared/utils/env.utils";
import "./shared/utils/debug.utils";

// Inicializar configuración de seguridad
try {
  initSecurity();
} catch (error) {
  console.error('Error crítico de seguridad:', error);
  // En producción, no continuar si hay errores de seguridad
  if (import.meta.env.PROD) {
    throw error;
  }
}

// Suprimir warnings de extensiones del navegador (solo en desarrollo)
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' && 
      (message.includes('runtime.lastError') || 
       message.includes('message port closed') ||
       message.includes('Extension context invalidated'))
    ) {
      return; // Suprimir estos warnings específicos
    }
    originalConsoleError.apply(console, args);
  };
}

// Inicializar base de datos y datos por defecto
async function initializeApp() {
  try {
    // 1. Inicializar la base de datos y modelos
    console.log('🔄 Inicializando aplicación...');
    await initDatabaseAndModels();
    
    // 2. Inicializar datos por defecto (usuario admin y datos de catálogo)
    await checkAndInitializeData();
    
    console.log('✅ Aplicación inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando aplicación:', error);
    // En desarrollo, continuar aunque falle la inicialización
    if (import.meta.env.PROD) {
      throw error;
    }
  }
}

// Inicializar la aplicación
initializeApp();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
