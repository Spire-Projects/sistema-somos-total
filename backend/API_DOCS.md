# API Documentation

## Authentication & User Management API

Esta API proporciona endpoints para autenticación y gestión de usuarios utilizando JWT, Express, Prisma y SQLite.

### Base URL
```
http://localhost:3000
```

### Endpoints Disponibles

#### 1. Status de la API
```
GET /
```
Respuesta:
```json
{
  "message": "API funcionando correctamente"
}
```

#### 2. Registro de Usuario
```
POST /auth/register
```
Body:
```json
{
  "fullName": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "mipassword123",
  "role": "USER" // Opcional, por defecto es "USER". Puede ser "USER" o "ADMIN"
}
```
Respuesta exitosa (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "clxxx...",
    "fullName": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "role": "USER",
    "isActive": true,
    "createdAt": "2025-06-16T21:45:00.000Z",
    "lastSession": null
  }
}
```

#### 3. Login
```
POST /auth/login
```
Body:
```json
{
  "email": "juan@ejemplo.com",
  "password": "mipassword123"
}
```
Respuesta exitosa (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": "clxxx...",
    "fullName": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "role": "USER",
    "isActive": true,
    "createdAt": "2025-06-16T21:45:00.000Z",
    "lastSession": "2025-06-16T21:50:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. Logout
```
POST /auth/logout
```
Headers: No requiere autenticación
Respuesta:
```json
{
  "message": "Logout successful"
}
```

#### 5. Obtener Perfil del Usuario (Protegido)
```
GET /users/profile
```
Headers:
```
Authorization: Bearer <token>
```
Respuesta:
```json
{
  "id": "clxxx...",
  "fullName": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "role": "USER",
  "isActive": true,
  "createdAt": "2025-06-16T21:45:00.000Z",
  "lastSession": "2025-06-16T21:50:00.000Z"
}
```

#### 6. Listar Usuarios con Paginación (Solo Admin)
```
GET /users?page=1&limit=10
```
Headers:
```
Authorization: Bearer <admin_token>
```
Query Parameters:
- `page`: Número de página (por defecto: 1)
- `limit`: Elementos por página (por defecto: 10, máximo: 100)

Respuesta:
```json
{
  "users": [
    {
      "id": "clxxx...",
      "fullName": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-06-16T21:45:00.000Z",
      "lastSession": "2025-06-16T21:50:00.000Z"
    }
  ],
  "total": 1,
  "totalPages": 1,
  "currentPage": 1
}
```

#### 7. Eliminar Usuario (Solo Admin)
```
DELETE /users/:id
```
Headers:
```
Authorization: Bearer <admin_token>
```
Respuesta exitosa:
```json
{
  "message": "User deleted successfully"
}
```

### Códigos de Error Comunes

- `400`: Bad Request - Datos faltantes o inválidos
- `401`: Unauthorized - Token faltante o inválido
- `403`: Forbidden - Permisos insuficientes
- `404`: Not Found - Recurso no encontrado
- `409`: Conflict - Email ya existe al registrar
- `500`: Internal Server Error - Error del servidor

### Ejemplo de Uso con curl

1. Registrar un admin:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

2. Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

3. Listar usuarios (usando el token del paso anterior):
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Notas Importantes

- Los tokens JWT expiran en 24 horas
- Las contraseñas se hashean con bcrypt
- Solo los usuarios con rol ADMIN pueden listar y eliminar usuarios
- Los usuarios no pueden eliminarse a sí mismos
- La paginación tiene un límite máximo de 100 elementos por página
