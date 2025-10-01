const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { join } = require('path');
const puppeteer = require('puppeteer');
const { writeFileSync, unlinkSync, mkdtempSync } = require('fs');
const { tmpdir } = require('os');

// Variables para los procesos
let mainWindow = null;

// Configuración
const isDev = process.env.NODE_ENV === 'development';

function getFrontendUrl() {
  // En desarrollo, usar el dev server de Vite
  if (isDev && !app.isPackaged) {
    return 'http://localhost:4321';
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
      preload: join(__dirname, 'preload.js'),
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

  // Manejar ventanas nuevas (incluyendo popups e impresión)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Si es una URL blob (para impresión) o about:blank, permitir
    if (url.startsWith('blob:') || url === 'about:blank' || url === '') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 800,
          height: 600,
          show: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Permitir contenido local para impresión
          }
        }
      };
    }
    
    // Para URLs externas, abrir en navegador por defecto
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    // Denegar otras URLs por seguridad
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
    
    if (isDev && !app.isPackaged) {
      console.log('📱 Modo desarrollo: Esperando que Vite esté disponible en http://localhost:5175');
      console.log('💡 Asegúrate de ejecutar "npm run dev:frontend" en otra terminal');
    } else {
    }
    
    // Crear ventana principal
    createWindow();
  } catch (error) {
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

// Función para generar PDF usando Puppeteer
async function generatePDFFromHTML(htmlContent) {
  let browser;
  let tempDir;
  
  try {
    // Crear directorio temporal
    tempDir = mkdtempSync(join(tmpdir(), 'farmacia-pdf-'));
    const tempHtmlPath = join(tempDir, 'report.html');
    const tempPdfPath = join(tempDir, 'report.pdf');
    
    // Escribir HTML temporal
    writeFileSync(tempHtmlPath, htmlContent, 'utf8');
    
    // Lanzar Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Cargar el HTML
    await page.goto(`file://${tempHtmlPath}`, { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Generar PDF con configuración exacta
    await page.pdf({
      path: tempPdfPath,
      format: 'Letter',
      margin: {
        top: '0mm',
        right: '10mm', 
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    // Limpiar HTML temporal
    try { unlinkSync(tempHtmlPath); } catch (e) {}
    
    return tempPdfPath;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Handler para generar PDF e imprimir
ipcMain.handle('generate-and-print-pdf', async (_event, htmlContent) => {
  try {
    console.log('📄 Generando PDF desde HTML...');
    
    // Generar PDF usando Puppeteer
    const pdfPath = await generatePDFFromHTML(htmlContent);
    console.log('✅ PDF generado:', pdfPath);
    
    // Abrir el PDF con el visor por defecto para imprimir
    await shell.openPath(pdfPath);
    
    // Limpiar PDF después de 30 segundos (tiempo para que se abra)
    setTimeout(() => {
      try {
        unlinkSync(pdfPath);
        console.log('🗑️ PDF temporal eliminado');
      } catch (e) {
        console.warn('⚠️ No se pudo eliminar PDF temporal:', e);
      }
    }, 30000);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido'
    };
  }
});

module.exports = { app, mainWindow };
