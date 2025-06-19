import { contextBridge, ipcRenderer } from 'electron';
// API expuesta al renderer de forma segura
const electronAPI = {
    // Información de la aplicación
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
    // Eventos del sistema (opcional)
    onAppUpdate: (callback) => {
        ipcRenderer.on('app-update-available', callback);
        return () => ipcRenderer.removeListener('app-update-available', callback);
    },
    // Notificaciones (opcional)
    showNotification: (title, message) => {
        return ipcRenderer.invoke('show-notification', { title, message });
    }
};
// Exponer la API al contexto del renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
// Para desarrollo - log de la versión
window.addEventListener('DOMContentLoaded', () => {
    console.log('Electron Preload Script loaded');
    console.log('Electron version:', process.versions.electron);
    console.log('Chrome version:', process.versions.chrome);
    console.log('Node version:', process.versions.node);
});
//# sourceMappingURL=preload.js.map