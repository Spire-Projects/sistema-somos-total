const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { join } = require('path');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Variables para los procesos
let mainWindow = null;
let httpServer = null;

// Configuración
const isDev = process.env.NODE_ENV === 'development';

// Función para crear servidor HTTP local en aplicaciones empaquetadas
function createLocalServer() {
  if (isDev && !app.isPackaged) {
    return Promise.resolve(); // No necesario en desarrollo
  }

  return new Promise((resolve, reject) => {
    const distPath = app.isPackaged 
      ? join(process.resourcesPath, 'app.asar.unpacked', 'frontend', 'dist')
      : join(__dirname, '..', 'frontend', 'dist');

    console.log('🌐 Iniciando servidor local desde:', distPath);

    httpServer = http.createServer((req, res) => {
      let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
      
      // Manejar rutas de React Router (SPA)
      if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        filePath = path.join(distPath, 'index.html');
      }

      const extname = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };

      const contentType = mimeTypes[extname] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('404 - File not found');
          } else {
            res.writeHead(500);
            res.end('Server Error');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    httpServer.listen(8080, 'localhost', (err) => {
      if (err) {
        console.error('❌ Error iniciando servidor local:', err);
        reject(err);
      } else {
        console.log('✅ Servidor local iniciado en http://localhost:8080');
        resolve();
      }
    });
  });
}

function getFrontendUrl() {
  // En desarrollo, usar el dev server de Vite
  if (isDev && !app.isPackaged) {
    return 'http://localhost:9999';
  }
  
  // En producción, usar servidor HTTP local
  return 'http://localhost:8080';
}

function createWindow() {
  // Crear la ventana principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.cjs'),
      webSecurity: false, // Deshabilitar para archivos locales
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    },
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default',
    autoHideMenuBar: true // Ocultar barra de menú por defecto
  });
  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Abrir DevTools en desarrollo o para debug en producción
    if (isDev || !app.isPackaged) {
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
  console.log('🌐 Cargando URL:', frontendUrl);
  
  mainWindow.loadURL(frontendUrl).catch(err => {
    console.error('❌ Error al cargar URL:', err);
  });

  // Agregar listeners para debug en producción
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Falló la carga:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página cargada exitosamente');
  });
}

async function initializeApp() {
  try {
    if (isDev && !app.isPackaged) {
      console.log('📱 Modo desarrollo: Esperando que Vite esté disponible en http://localhost:5175');
      console.log('💡 Asegúrate de ejecutar "npm run dev:frontend" en otra terminal');
    } else {
      await createLocalServer();
    }
    
    // Crear ventana principal
    createWindow();
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
  
  // Cerrar servidor HTTP si está activo
  if (httpServer) {
    httpServer.close();
    console.log('🌐 Servidor HTTP local cerrado');
  }
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
