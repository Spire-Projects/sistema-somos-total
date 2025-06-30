const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { join } = require('path');

// Variables para los procesos
let mainWindow = null;

// Configuración
const isDev = process.env.NODE_ENV === 'development';

function getFrontendUrl() {
  // En desarrollo, usar el dev server de Vite
  if (isDev && !app.isPackaged) {
    return 'http://localhost:5173';
  }
  
  // En producción, usar archivos estáticos desde file://
  const frontendDistPath = join(__dirname, '..', 'frontend', 'dist', 'index.html');
  return `file://${frontendDistPath}`;
}

function createWindow() {
  // Crear la ventana principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.cjs'),
      webSecurity: true
    },
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default',
    autoHideMenuBar: true // Ocultar barra de menú por defecto
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

async function initializeApp() {
  try {
    console.log('🚀 Inicializando FarmaApp...');
    
    if (isDev && !app.isPackaged) {
      console.log('📱 Modo desarrollo: Esperando que Vite esté disponible en http://localhost:5174');
      console.log('💡 Asegúrate de ejecutar "npm run dev:frontend" en otra terminal');
    } else {
      console.log('📦 Modo producción: Usando archivos compilados');
    }
    
    // Crear ventana principal
    createWindow();
    
    console.log('✅ FarmaApp inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar FarmaApp:', error);
    app.quit();
  }
}

// Eventos de la aplicación
app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
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
