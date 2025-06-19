"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainWindow = exports.app = void 0;
var electron_1 = require("electron");
Object.defineProperty(exports, "app", { enumerable: true, get: function () { return electron_1.app; } });
var path_1 = require("path");
var url_1 = require("url");
var child_process_1 = require("child_process");
var vite_1 = require("vite");
var express_1 = require("express");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
// Variables para los procesos
var mainWindow = null;
exports.mainWindow = mainWindow;
var backendProcess = null;
var frontendDevServer = null;
// Configuración
var isDev = process.env.NODE_ENV === 'development';
var BACKEND_PORT = 3001;
var FRONTEND_PORT = 5173;
function startBackend() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var _a, _b;
                    var backendPath = (0, path_1.join)(__dirname, '..', 'backend');
                    console.log('Iniciando backend en:', backendPath);
                    // En desarrollo usar npm run dev, en producción usar el build
                    var command = isDev ? 'npm' : 'node';
                    var args = isDev ? ['run', 'dev'] : ['dist/index.js'];
                    backendProcess = (0, child_process_1.spawn)(command, args, {
                        cwd: backendPath,
                        stdio: 'pipe',
                        env: __assign(__assign({}, process.env), { PORT: BACKEND_PORT.toString() })
                    });
                    (_a = backendProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                        console.log("Backend: ".concat(data.toString()));
                    });
                    (_b = backendProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                        console.error("Backend Error: ".concat(data.toString()));
                    });
                    backendProcess.on('error', function (error) {
                        console.error('Error al iniciar backend:', error);
                        reject(error);
                    });
                    // Esperar un poco para que el backend se inicie
                    setTimeout(function () {
                        console.log('Backend iniciado correctamente');
                        resolve();
                    }, 3000);
                })];
        });
    });
}
function startFrontend() {
    return __awaiter(this, void 0, void 0, function () {
        var frontendPath, vite, error_1, frontendDistPath_1, staticApp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isDev) return [3 /*break*/, 6];
                    frontendPath = (0, path_1.join)(__dirname, '..', 'frontend');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, (0, vite_1.createServer)({
                            root: frontendPath,
                            server: {
                                port: FRONTEND_PORT,
                                host: 'localhost'
                            }
                        })];
                case 2:
                    vite = _a.sent();
                    return [4 /*yield*/, vite.listen()];
                case 3:
                    _a.sent();
                    frontendDevServer = vite;
                    console.log("Frontend dev server iniciado en http://localhost:".concat(FRONTEND_PORT));
                    return [2 /*return*/, "http://localhost:".concat(FRONTEND_PORT)];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error al iniciar Vite dev server:', error_1);
                    throw error_1;
                case 5: return [3 /*break*/, 7];
                case 6:
                    frontendDistPath_1 = (0, path_1.join)(__dirname, '..', 'frontend', 'dist');
                    staticApp = (0, express_1.default)();
                    staticApp.use(express_1.default.static(frontendDistPath_1));
                    staticApp.get('*', function (req, res) {
                        res.sendFile((0, path_1.join)(frontendDistPath_1, 'index.html'));
                    });
                    staticApp.listen(FRONTEND_PORT, function () {
                        console.log("Frontend est\u00E1tico servido en puerto ".concat(FRONTEND_PORT));
                    });
                    return [2 /*return*/, "http://localhost:".concat(FRONTEND_PORT)];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function createWindow() {
    // Crear la ventana principal
    exports.mainWindow = mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: (0, path_1.join)(__dirname, 'preload.js') // Opcional: para comunicación segura
        },
        icon: isDev ? undefined : (0, path_1.join)(__dirname, '..', 'assets', 'icon.png'),
        show: false, // No mostrar hasta que esté listo
        titleBarStyle: 'default'
    });
    // Mostrar ventana cuando esté lista
    mainWindow.once('ready-to-show', function () {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
        // Abrir DevTools en desarrollo
        if (isDev) {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.openDevTools();
        }
    });
    // Limpiar referencia cuando se cierre
    mainWindow.on('closed', function () {
        exports.mainWindow = mainWindow = null;
    });
    // Prevenir navegación externa
    mainWindow.webContents.setWindowOpenHandler(function (_a) {
        var url = _a.url;
        // Permitir solo URLs locales
        if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
            return { action: 'allow' };
        }
        return { action: 'deny' };
    });
}
function initializeApp() {
    return __awaiter(this, void 0, void 0, function () {
        var frontendUrl_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log('Inicializando aplicación...');
                    // Iniciar backend
                    return [4 /*yield*/, startBackend()];
                case 1:
                    // Iniciar backend
                    _a.sent();
                    return [4 /*yield*/, startFrontend()];
                case 2:
                    frontendUrl_1 = _a.sent();
                    // Crear ventana y cargar frontend
                    createWindow();
                    // Esperar un poco más para asegurar que todo esté listo
                    setTimeout(function () {
                        if (mainWindow) {
                            mainWindow.loadURL(frontendUrl_1);
                        }
                    }, 2000);
                    console.log('Aplicación inicializada correctamente');
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error al inicializar la aplicación:', error_2);
                    electron_1.app.quit();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Eventos de la aplicación
electron_1.app.whenReady().then(initializeApp);
electron_1.app.on('window-all-closed', function () {
    // En macOS es común mantener la app activa aunque no haya ventanas
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    // En macOS, recrear ventana cuando se hace clic en el dock
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// Limpieza al cerrar
electron_1.app.on('before-quit', function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Cerrando aplicación...');
                if (!frontendDevServer) return [3 /*break*/, 4];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, frontendDevServer.close()];
            case 2:
                _a.sent();
                console.log('Frontend dev server cerrado');
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('Error al cerrar frontend dev server:', error_3);
                return [3 /*break*/, 4];
            case 4:
                // Cerrar backend
                if (backendProcess) {
                    backendProcess.kill('SIGTERM');
                    console.log('Backend cerrado');
                }
                return [2 /*return*/];
        }
    });
}); });
// IPC handlers para comunicación con el renderer (opcional)
electron_1.ipcMain.handle('get-app-version', function () {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('get-backend-status', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            // Aquí podrías hacer una verificación del estado del backend
            return [2 /*return*/, { status: 'running', port: BACKEND_PORT }];
        }
        catch (error) {
            return [2 /*return*/, { status: 'error', error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
