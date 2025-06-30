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
    return true;
  } catch (error) {
    console.error('❌ Error inicializando aplicación:', error);
    // En desarrollo, continuar aunque falle la inicialización
    if (import.meta.env.PROD) {
      throw error;
    }
    return false;
  }
}

// Función principal que espera la inicialización antes de renderizar
async function main() {
  try {
    console.log('🚀 Iniciando FarmaApp...');
    
    // Esperar a que la aplicación se inicialice completamente
    const initialized = await initializeApp();
    
    if (!initialized && import.meta.env.PROD) {
      throw new Error('Failed to initialize application');
    }
    
    // Solo renderizar React después de que todo esté listo
    console.log('🎨 Renderizando interfaz de usuario...');
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </StrictMode>
    );
    
    console.log('🎉 FarmaApp cargada exitosamente');
  } catch (error) {
    console.error('💥 Error fatal iniciando aplicación:', error);
    
    // Mostrar error en la UI
    document.getElementById("root")!.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red; font-family: Arial, sans-serif;">
        <h1>Error de Inicialización</h1>
        <p>No se pudo inicializar la aplicación.</p>
        <p>Por favor, recarga la página.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">
          Recargar
        </button>
      </div>
    `;
  }
}

// Ejecutar la función principal
main();
