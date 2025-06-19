# Sistema de Autenticación y Gestión de Usuarios - FarmaApp

## Resumen de Implementación Completada

### ✅ Funcionalidades Implementadas

#### 1. **Modelo de Usuario**
- Interfaz `User` con campos: id, fullName, email, passwordHash, role, active, createdAt, lastSession
- Roles disponibles: `"cashier"` | `"admin"`
- Tipos auxiliares para CreationUserData, UpdateUserData, LoginCredentials, AuthUser

#### 2. **Autenticación y Seguridad**
- **Encriptación de contraseñas** con bcrypt (salt rounds: 12)
- **JWT (JSON Web Tokens)** para autenticación
- **Middleware de autenticación** para proteger rutas
- **Middleware de autorización** por roles

#### 3. **Base de Datos**
- **PouchDB** con adaptador LevelDB
- Helpers CRUD completos para usuarios
- **Paginación** implementada para consultas de usuarios
- **Índices** optimizados para búsquedas por email, role, active

#### 4. **Endpoints Implementados**

##### Rutas Públicas:
- `POST /api/users/register` - Registro de usuarios
- `POST /api/users/login` - Autenticación de usuarios

##### Rutas Protegidas (próximas a implementar):
- `GET /api/users/me` - Perfil del usuario actual
- `GET /api/users` - Lista todos los usuarios (solo admin, con paginación)
- `GET /api/users/:id` - Obtener usuario por ID (admin o el mismo usuario)
- `PUT /api/users/:id` - Actualizar usuario (admin o el mismo usuario)
- `PATCH /api/users/:id/deactivate` - Desactivar usuario (solo admin)
- `DELETE /api/users/:id` - Eliminar usuario (solo admin)

#### 5. **Validaciones**
- **express-validator** para validación de entrada
- Validaciones para registro, login, actualización y paginación
- Manejo de errores centralizado

#### 6. **Inicialización Automática**
- **Usuario administrador por defecto**:
  - Email: `admin@farmaapp.com`
  - Contraseña: `admin123`
  - Rol: `admin`

### 🔧 Configuración JWT
- Secret configurable vía `JWT_SECRET` (env variable)
- Expiración configurable vía `JWT_EXPIRES_IN` (default: 24h)
- Token incluye: id, email, role, fullName

### 📁 Estructura de Archivos Creados/Modificados

```
src/
├── models/
│   └── user.model.ts           # Interfaces y tipos de usuario
├── controllers/
│   └── user.controller.ts      # Controladores de usuario
├── middleware/
│   ├── auth.middleware.ts      # Middleware de autenticación
│   └── validation.middleware.ts # Middleware de validación
├── routes/
│   └── user.routes.ts          # Rutas de usuario
├── utils/
│   ├── auth.utils.ts           # Utilidades de autenticación
│   └── init-data.utils.ts      # Inicialización de datos
├── config/
│   └── config.ts               # Configuración JWT agregada
├── db/
│   └── database.ts             # Helpers de usuario agregados
└── index.ts                    # Rutas integradas y inicialización
```

### 🚀 Cómo Usar

#### 1. Login con usuario admin:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@farmaapp.com", "password": "admin123"}'
```

#### 2. Registrar nuevo usuario:
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nombre Completo",
    "email": "usuario@farmaapp.com", 
    "password": "password123",
    "role": "cashier"
  }'
```

#### 3. Usar token en rutas protegidas:
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 🔒 Seguridad Implementada

1. **Contraseñas hasheadas** con bcrypt
2. **JWT con expiración** configurable
3. **Validación de entrada** en todos los endpoints
4. **Autorización por roles** (admin/cashier)
5. **Verificación de usuario activo** en cada request
6. **Protección contra ataques comunes** (inyección, XSS)

### 📋 Pendientes para Rutas Protegidas

Las rutas protegidas están implementadas en los controladores pero necesitan ser integradas con el middleware de autenticación. Actualmente están funcionando las rutas básicas de login y registro.

### 🔄 Paginación

Todas las consultas que devuelven listas incluyen paginación:
- `page`: número de página (default: 1)
- `size`: elementos por página (default: 10, max: 100)
- Respuesta incluye: `total`, `totalPages`, `page`, `size`

### ⚠️ Notas de Seguridad para Producción

1. **Cambiar JWT_SECRET** por un valor secreto seguro
2. **Cambiar contraseña del admin** por defecto
3. **Configurar HTTPS** en producción
4. **Implementar rate limiting** para endpoints de login
5. **Configurar CORS** adecuadamente para el frontend
