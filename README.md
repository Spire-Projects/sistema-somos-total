# FarmaApp MonoRepo

Aplicación Electron con backend Express y frontend React para gestión de farmacia.

## Estructura del Proyecto

```
├── package.json          # Configuración principal del monorepo
├── backend/              # Backend Express con RxDB y LevelDB
├── frontend/             # Frontend React con Vite y Tailwind
└── electron/             # Aplicación Electron
```

## Tecnologías

### Backend
- **Express.js** - Framework web
- **RxDB** - Base de datos reactiva
- **LevelDB** - Motor de almacenamiento
- **JWT** - Autenticación
- **TypeScript** - Tipado estático

### Frontend
- **React 19** - Framework de UI
- **Vite** - Build tool
- **Tailwind CSS** - Framework de CSS
- **Redux Toolkit** - Gestión de estado
- **Axios** - Cliente HTTP
- **TypeScript** - Tipado estático

### Electron
- **Electron** - Framework para aplicaciones de escritorio
- **TypeScript** - Tipado estático

## Instalación

### Instalar todas las dependencias
```bash
npm run install:all
```

## Scripts Disponibles

### Desarrollo

```bash
# Ejecutar solo el frontend (puerto 5173)
npm run dev:frontend

# Ejecutar solo el backend (puerto 3000)
npm run dev:backend

# Ejecutar Electron con watch mode
npm run dev:electron:watch

# Ejecutar solo Electron (requiere que esté compilado)
npm run dev:electron

# Ejecutar toda la aplicación Electron con frontend y backend integrados
npm run dev
```

### Construcción

```bash
# Construir frontend
npm run build:frontend

# Construir backend
npm run build:backend

# Construir Electron
npm run build:electron

# Construir todo
npm run build
```

### Distribución

```bash
# Crear ejecutable de la aplicación
npm run package
```

## Configuración

### Variables de Entorno

Puedes crear un archivo `.env` en la carpeta `backend/` con:

```env
PORT=3000
DB_PATH=./data/rxdb
JWT_SECRET=tu-clave-secreta-jwt
JWT_EXPIRES_IN=24h
```

### Puertos por Defecto

- **Backend**: 3000
- **Frontend**: 5173 (desarrollo)
- **Electron**: Integra ambos

## Uso

### Desarrollo Completo con Electron

1. Ejecutar el comando de desarrollo completo:
   ```bash
   npm run dev
   ```
   
   Esto iniciará:
   - Compilación de Electron en modo watch
   - Aplicación Electron que internamente maneja:
     - Backend Express en puerto 3000
     - Frontend Vite dev server en puerto 5173

2. La ventana de Electron se abrirá automáticamente mostrando el frontend

### Desarrollo Independiente

Si prefieres desarrollar cada parte por separado:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend  
npm run dev:frontend

# Terminal 3: Electron (después de compilar)
npm run build:electron
npm run dev:electron
```

## Credenciales por Defecto

Al iniciar por primera vez, se crea un usuario administrador:

- **Email**: admin@farmaapp.com
- **Contraseña**: admin123

⚠️ **Importante**: Cambia estas credenciales en producción.

## Arquitectura

### Backend (Puerto 3000)
- API REST con Express
- Base de datos RxDB con LevelDB
- Autenticación JWT
- Validación de datos
- CORS configurado

### Frontend (Puerto 5173)
- SPA React con React Router
- Estado global con Redux Toolkit
- UI con Tailwind CSS
- Comunicación con API via Axios

### Electron
- Ventana principal que carga el frontend
- Manejo automático del backend como proceso hijo
- Comunicación IPC para funciones nativas
- Empaquetado para distribución

## Scripts de Limpieza

```bash
# Limpiar archivos compilados
npm run clean
```

## Problemática Resuelta

Este monorepo resuelve la integración de:

1. **Backend Express** con base de datos RxDB/LevelDB
2. **Frontend React** con Vite y Tailwind
3. **Aplicación Electron** que los unifica

La configuración permite:
- ✅ Desarrollo independiente de cada parte
- ✅ Desarrollo integrado con Electron
- ✅ Build y distribución unificada
- ✅ Gestión centralizada de dependencias
- ✅ Hot reload en desarrollo
- ✅ TypeScript en todo el stack

## Próximos Pasos

1. Personalizar la UI del frontend
2. Implementar más funcionalidades de farmacia
3. Configurar CI/CD
4. Agregar tests automatizados
5. Configurar actualizaciones automáticas
