"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// API expuesta al renderer de forma segura
const electronAPI = {
    // Información de la aplicación
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    getAppInfo: () => electron_1.ipcRenderer.invoke('get-app-info'),
    // Eventos del sistema (opcional)
    onAppUpdate: (callback) => {
        electron_1.ipcRenderer.on('app-update-available', callback);
        return () => electron_1.ipcRenderer.removeListener('app-update-available', callback);
    },
    // Utilidades del sistema
    platform: process.platform,
    versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node
    }
};
// Exponer la API al contexto del renderer
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
// Para desarrollo - log de la versión
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 FarmaApp Electron Preload Script loaded');
    console.log('📦 Electron version:', process.versions.electron);
    console.log('🌐 Chrome version:', process.versions.chrome);
    console.log('📱 Platform:', process.platform);
});
//# sourceMappingURL=preload.js.map