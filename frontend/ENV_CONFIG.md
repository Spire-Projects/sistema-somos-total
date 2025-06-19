# Configuración de Archivos de Entorno (.env)

Este proyecto usa múltiples archivos `.env` para diferentes configuraciones. Vite los carga en el siguiente orden de prioridad (el último sobrescribe al anterior):

## 📁 Jerarquía de Archivos (Mayor prioridad al final)

1. **`.env`** - Configuración base compartida
2. **`.env.development`** - Configuración para modo desarrollo (`npm run dev`)
3. **`.env.production`** - Configuración para modo producción (`npm run build`)
4. **`.env.local`** - Configuración local personal (gitignored, mayor prioridad)

## 🔧 Archivos Disponibles

### `.env` - Base de desarrollo
```bash
VITE_APP_MODE=local  # Configuración por defecto
```

### `.env.development` - Desarrollo explícito
```bash
VITE_APP_MODE=local
VITE_DEBUG=true
VITE_JWT_SECRET=development_secret_key_local_mode
```

### `.env.production` - Producción
```bash
VITE_APP_MODE=deploy  # Solo Firestore
VITE_DEBUG=false
VITE_JWT_SECRET=YOUR_PRODUCTION_JWT_SECRET
```

### `.env.local` - Configuración local personal
```bash
VITE_APP_MODE=local
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

## 🚀 Comandos de Ejecución

### Desarrollo (Modo Local - RxDB/IndexedDB)
```bash
npm run dev           # Usa .env.development (modo local)
npm run dev:local     # Fuerza modo development
```

### Producción (Modo Deploy - Solo Firestore)
```bash
npm run build              # Usa .env.production (modo deploy)
npm run build:production   # Fuerza modo production
npm run dev:production     # Desarrollo con config de producción
```

## 📊 Estados de la Aplicación

### Modo `local` (VITE_APP_MODE=local)
- ✅ RxDB con IndexedDB (Dexie storage)
- ✅ Almacenamiento local offline
- ✅ Backup opcional a Firestore
- ✅ Ideal para desarrollo y Electron

### Modo `deploy` (VITE_APP_MODE=deploy)
- ✅ Solo Firestore (sin RxDB)
- ✅ Funciona sin IndexedDB
- ✅ Ideal para web hosting
- ✅ Menor tamaño del bundle

## 🔍 Verificar Configuración Actual

La consola del navegador mostrará automáticamente qué configuración se está usando al cargar la aplicación.
