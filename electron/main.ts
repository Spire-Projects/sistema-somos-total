import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Para ES modules compatibility
const __dirname = __filename ? dirname(__filename) : process.cwd();

// Variables para los procesos
let mainWindow: BrowserWindow | null = null;

// Configuración
const isDev = process.env.NODE_ENV === 'development';

function getFrontendUrl(): string {
  // En desarrollo, usar el dev server de Vite
  if (isDev && !app.isPackaged) {
    return 'http://localhost:5175';
  }
  
  // En producción, usar archivos estáticos desde file://
  const frontendDistPath = join(__dirname, '..', 'frontend', 'dist', 'index.html');
  return `file://${frontendDistPath}`;
}

function createWindow(): void {
  // Crear la ventana principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      webSecurity: true,
      backgroundThrottling: false,   // Mejora el rendimiento en segundo plano
      devTools: isDev,              // Deshabilita DevTools en producción
      spellcheck: false            // Desactiva corrector para ahorrar recursos
    },
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    backgroundColor: '#ffffff'     // Evita parpadeos al cargar
  });

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Abrir DevTools en desarrollo
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Limpiar referencia cuando se cierre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

 mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  return {
    action: 'allow',
    overrideBrowserWindowOptions: {
      width: 500,
      height: 400,
      ...(mainWindow ? { parent: mainWindow } : {}),
      modal: false
    }
  };
});

  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Abrir enlaces externos en el navegador por defecto
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevenir navegación externa no deseada
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  // Cargar la aplicación
  const frontendUrl = getFrontendUrl();
  mainWindow.loadURL(frontendUrl);
}

async function initializeApp(): Promise<void> {
  try {
    if (isDev && !app.isPackaged) {
      console.log('📱 Modo desarrollo: Esperando que Vite esté disponible en http://localhost:5175');
      console.log('💡 Asegúrate de ejecutar "npm run dev:frontend" en otra terminal');
    } else {
    }
    
    // Crear ventana principal
    createWindow();
  } catch (error) {
    console.error('❌ Error al inicializar FarmaApp:', error);
    app.quit();
  }
}

// Gestión de memoria y optimización MEJORADA
async function cleanupResourcesSafe(): Promise<void> {
  if (!mainWindow) return;
  
  console.log('🧹 Iniciando limpieza suave de recursos...');
  
  try {
    // Solo limpiar cache si no hay actividad reciente
    const memoryInfo = await process.getProcessMemoryInfo();
    console.log('💾 Memoria actual:', {
      resident: Math.round(memoryInfo.residentSet / 1024 / 1024) + 'MB',
      heap: Math.round(memoryInfo.private / 1024 / 1024) + 'MB'
    });
    
    // Solo hacer limpieza agresiva si se supera el límite (usando residentSet)
    if (memoryInfo.residentSet > 500 * 1024 * 1024) { // 500MB
      console.log('⚠️ Memoria alta detectada, iniciando limpieza...');
      
      // Hacer limpieza en chunks pequeños para evitar bloqueos
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.webContents.session.clearCache();
        }
      }, 100);
      
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.webContents.session.clearStorageData({
            storages: ['shadercache', 'serviceworkers']
            // 🔥 EXCLUIR cachestorage para no afectar la app
          });
        }
      }, 200);
      
      // GC suave después de un delay
      setTimeout(() => {
        if (global.gc) {
          console.log('🗑️ Ejecutando garbage collection...');
          global.gc();
        }
      }, 300);
    }
    
    console.log('✅ Limpieza completada');
  } catch (error) {
    console.error('❌ Error en limpieza de recursos:', error);
  }
}

// 🔥 NUEVO: Sistema de monitoreo inteligente de memoria
let cleanupInterval: NodeJS.Timeout | null = null;

function startMemoryMonitoring(): void {
  console.log('🔍 Iniciando monitoreo inteligente de memoria...');
  
  // Limpiar cada 45 minutos en lugar de 30 (menos agresivo)
  cleanupInterval = setInterval(() => {
    void cleanupResourcesSafe();
  }, 2700000); // 45 minutos
}

function stopMemoryMonitoring(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🛑 Monitoreo de memoria detenido');
  }
}

// Limpiar recursos periódicamente (REEMPLAZADO por sistema inteligente)
// setInterval(cleanupResources, 1800000); // ❌ ELIMINADO: Causa trabas

// Optimizaciones de rendimiento
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows'); // 🔥 CRÍTICO: Evita pausar cuando la ventana está oculta

// 🔥 NUEVAS OPTIMIZACIONES PARA EVITAR TRABAS:
app.commandLine.appendSwitch('max-old-space-size', '2048');      // Límite RAM: 2GB
app.commandLine.appendSwitch('max-semi-space-size', '128');      // Limite heap joven
app.commandLine.appendSwitch('disable-dev-shm-usage');          // Evita problemas de memoria compartida
app.commandLine.appendSwitch('disable-software-rasterizer');    // Usa GPU cuando disponible

// Eventos de la aplicación
app.whenReady().then(() => {
  initializeApp();
  
  // Comenzar monitoreo de memoria después de 5 minutos
  setTimeout(() => {
    startMemoryMonitoring();
  }, 300000); // 5 minutos de gracia al inicio
});

app.on('window-all-closed', () => {
  stopMemoryMonitoring(); // 🔥 NUEVO: Detener monitoreo primero
  void cleanupResourcesSafe(); // 🔥 CAMBIO: Usar versión segura
  
  // En macOS es común mantener la app activa aunque no haya ventanas
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // En macOS, recrear ventana cuando se hace clic en el dock
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 🔥 NUEVO: Manejar minimización para evitar trabas
app.on('browser-window-blur', () => {
  console.log('👁️ Ventana perdió foco - modo ahorro activado');
});

app.on('browser-window-focus', () => {
  console.log('👁️ Ventana recuperó foco - modo normal');
});

// Limpieza al cerrar
app.on('before-quit', async () => {
  console.log('🔄 Cerrando FarmaApp...');
});

// IPC handlers para comunicación con el renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-info', async () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    isDev: isDev,
    platform: process.platform
  };
});

module.exports = { app, mainWindow };