import { forceSyncService } from '../services/ForceSyncService';

/**
 * Utilitarios globales para debugging de sincronización
 * Agregar al window object para fácil acceso desde DevTools
 */
declare global {
  interface Window {
    syncDebug: {
      forceSync: () => Promise<void>;
      checkStatus: () => Promise<Record<string, any>>;
      resolvePending: () => Promise<void>;
      enableVerboseLogging: () => void;
      disableVerboseLogging: () => void;
    };
  }
}

/**
 * Configurar herramientas de debugging para sincronización
 * Llamar esta función una vez al inicializar la app
 */
export const setupSyncDebugging = () => {
  if (typeof window !== 'undefined') {
    window.syncDebug = {
      forceSync: async () => {
        console.log('🚀 Debug: Forzando sincronización completa...');
        await forceSyncService.forceFullSync();
        console.log('✅ Debug: Sincronización completada');
      },

      checkStatus: async () => {
        console.log('📊 Debug: Verificando estado de sincronización...');
        const status = await forceSyncService.checkSyncStatus();
        console.table(status);
        return status;
      },

      resolvePending: async () => {
        console.log('🔍 Debug: Resolviendo documentos pendientes...');
        await forceSyncService.resolvePendingSync();
        console.log('✅ Debug: Documentos pendientes resueltos');
      },

      enableVerboseLogging: () => {
        localStorage.setItem('rxdb-verbose-logging', 'true');
        console.log('🔊 Debug: Logging verboso activado');
      },

      disableVerboseLogging: () => {
        localStorage.removeItem('rxdb-verbose-logging');
        console.log('🔇 Debug: Logging verboso desactivado');
      }
    };

    console.log(`
🛠️ Herramientas de Sincronización Disponibles:
- window.syncDebug.forceSync() - Forzar sincronización completa
- window.syncDebug.checkStatus() - Verificar estado de todas las colecciones  
- window.syncDebug.resolvePending() - Resolver documentos pendientes
- window.syncDebug.enableVerboseLogging() - Activar logging detallado
- window.syncDebug.disableVerboseLogging() - Desactivar logging detallado
    `);
  }
};

/**
 * Función para agregar a cualquier página como botón de emergencia
 */
export const createSyncEmergencyButton = (): HTMLButtonElement => {
  const button = document.createElement('button');
  button.innerHTML = '🔄 SYNC EMERGENCY';
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    padding: 8px 12px;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-size: 12px;
  `;
  
  button.onclick = async () => {
    button.innerHTML = '🔄 Sincronizando...';
    button.disabled = true;
    
    try {
      await forceSyncService.forceFullSync();
      button.innerHTML = '✅ Completado!';
      setTimeout(() => {
        button.innerHTML = '🔄 SYNC EMERGENCY';
        button.disabled = false;
      }, 2000);
    } catch (error) {
      button.innerHTML = '❌ Error!';
      console.error('Error en sincronización de emergencia:', error);
      setTimeout(() => {
        button.innerHTML = '🔄 SYNC EMERGENCY';
        button.disabled = false;
      }, 2000);
    }
  };
  
  document.body.appendChild(button);
  return button;
};

/**
 * Monitor de sincronización que muestra estado en tiempo real
 */
export const createSyncMonitor = () => {
  const monitor = document.createElement('div');
  monitor.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 9999;
    padding: 8px;
    background: rgba(0,0,0,0.8);
    color: white;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    max-width: 300px;
    max-height: 200px;
    overflow-y: auto;
  `;
  
  monitor.innerHTML = '<div>🔄 Monitor de Sincronización</div>';
  
  // Actualizar estado cada 10 segundos
  setInterval(async () => {
    try {
      const status = await forceSyncService.checkSyncStatus();
      const statusLines = Object.entries(status).map(([collection, info]) => {
        const isActive = (info as any)?.isActive;
        const icon = isActive ? '🟢' : '🔴';
        return `${icon} ${collection}: ${isActive ? 'OK' : 'INACTIVE'}`;
      });
      
      monitor.innerHTML = `
        <div>🔄 Monitor de Sincronización</div>
        <div style="font-size: 10px; margin-top: 4px;">
          ${statusLines.join('<br>')}
        </div>
        <div style="font-size: 9px; margin-top: 4px; opacity: 0.7;">
          Actualizado: ${new Date().toLocaleTimeString()}
        </div>
      `;
    } catch (error) {
      monitor.innerHTML = `
        <div>🔄 Monitor de Sincronización</div>
        <div style="color: #ff6666; font-size: 10px;">
          Error al obtener estado
        </div>
      `;
    }
  }, 10000);
  
  document.body.appendChild(monitor);
  return monitor;
};
