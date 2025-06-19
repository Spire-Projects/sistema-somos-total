import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import { createServer } from 'vite';
import express, { Request, Response } from 'express';

// Para ES modules compatibility
const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = dirname(__filename);

// Variables para los procesos
let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
let frontendDevServer: any = null;

// Configuración
const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

async function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const backendPath = join(__dirname, '..', 'backend');
    
    console.log('Iniciando backend en:', backendPath);
    
    // En desarrollo usar npm run dev, en producción usar el build
    const command = isDev ? 'npm' : 'node';
    const args = isDev ? ['run', 'dev'] : ['dist/index.js'];
    
    backendProcess = spawn(command, args, {
      cwd: backendPath,
      stdio: 'pipe',
      env: { ...process.env, PORT: BACKEND_PORT.toString() }
    });

    backendProcess.stdout?.on('data', (data) => {
      console.log(`Backend: ${data.toString()}`);
    });

    backendProcess.stderr?.on('data', (data) => {
      console.error(`Backend Error: ${data.toString()}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Error al iniciar backend:', error);
      reject(error);
    });

    // Esperar un poco para que el backend se inicie
    setTimeout(() => {
      console.log('Backend iniciado correctamente');
      resolve();
    }, 3000);
  });
}

async function startFrontend(): Promise<string> {
  if (isDev) {
    // En desarrollo, usar Vite dev server
    const frontendPath = join(__dirname, '..', 'frontend');
    
    try {
      const vite = await createServer({
        root: frontendPath,
        server: {
          port: FRONTEND_PORT,
          host: 'localhost'
        }
      });
      
      await vite.listen();
      frontendDevServer = vite;
      
      console.log(`Frontend dev server iniciado en http://localhost:${FRONTEND_PORT}`);
      return `http://localhost:${FRONTEND_PORT}`;
    } catch (error) {
      console.error('Error al iniciar Vite dev server:', error);
      throw error;
    }
  } else {
    // En producción, servir archivos estáticos
    const frontendDistPath = join(__dirname, '..', 'frontend', 'dist');
    
    const staticApp = express();
    staticApp.use(express.static(frontendDistPath));
    
    staticApp.get('*', (req: Request, res: Response) => {
      res.sendFile(join(frontendDistPath, 'index.html'));
    });
    
    staticApp.listen(FRONTEND_PORT, () => {
      console.log(`Frontend estático servido en puerto ${FRONTEND_PORT}`);
    });
    
    return `http://localhost:${FRONTEND_PORT}`;
  }
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
      preload: join(__dirname, 'preload.js') // Opcional: para comunicación segura
    },
    icon: isDev ? undefined : join(__dirname, '..', 'assets', 'icon.png'),
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default'
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

  // Prevenir navegación externa
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Permitir solo URLs locales
    if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
      return { action: 'allow' };
    }
    return { action: 'deny' };
  });
}

async function initializeApp(): Promise<void> {
  try {
    console.log('Inicializando aplicación...');
    
    // Iniciar backend
    await startBackend();
    
    // Iniciar frontend
    const frontendUrl = await startFrontend();
    
    // Crear ventana y cargar frontend
    createWindow();
    
    // Esperar un poco más para asegurar que todo esté listo
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.loadURL(frontendUrl);
      }
    }, 2000);
    
    console.log('Aplicación inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
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
  console.log('Cerrando aplicación...');
  
  // Cerrar frontend dev server
  if (frontendDevServer) {
    try {
      await frontendDevServer.close();
      console.log('Frontend dev server cerrado');
    } catch (error) {
      console.error('Error al cerrar frontend dev server:', error);
    }
  }
  
  // Cerrar backend
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    console.log('Backend cerrado');
  }
});

// IPC handlers para comunicación con el renderer (opcional)
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-backend-status', async () => {
  try {
    // Aquí podrías hacer una verificación del estado del backend
    return { status: 'running', port: BACKEND_PORT };
  } catch (error: any) {
    return { status: 'error', error: error.message };
  }
});

export { app, mainWindow };