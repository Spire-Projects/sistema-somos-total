# API Documentation - FarmaApp

## Base URL
```
http://localhost:3000
```

## Authentication
La API usa JWT (JSON Web Tokens) para autenticación. Incluye el token en el header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 👥 Users Endpoints

### 🔓 Public Endpoints (No authentication required)

#### POST `/api/users/register`
Registrar un nuevo usuario.

**Body:**
```json
{
  "fullName": "string (2-50 chars)",
  "email": "valid_email@domain.com",
  "password": "string (min 6 chars, must contain uppercase, lowercase, number)",
  "role": "cashier" | "admin"
}
```

**Response 201:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "role": "cashier" | "admin",
    "active": true,
    "createdAt": "ISO_date_string"
  }
}
```

**Errors:**
- `400` - Validation errors
- `409` - Email already exists

---

#### POST `/api/users/login`
Autenticar usuario.

**Body:**
```json
{
  "email": "valid_email@domain.com",
  "password": "string"
}
```

**Response 200:**
```json
{
  "message": "Login exitoso",
  "token": "jwt_token_string",
  "user": {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "role": "cashier" | "admin",
    "active": true,
    "createdAt": "ISO_date_string",
    "lastSession": "ISO_date_string"
  }
}
```

**Errors:**
- `401` - Invalid credentials or user inactive
- `400` - Missing email or password

---

### 🔒 Protected Endpoints (Authentication required)

#### GET `/api/users/me`
Obtener perfil del usuario actual.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response 200:**
```json
{
  "id": "uuid",
  "fullName": "string",
  "email": "string",
  "role": "cashier" | "admin",
  "active": true,
  "createdAt": "ISO_date_string",
  "lastSession": "ISO_date_string"
}
```

---

#### GET `/api/users` 🔒 Admin Only
Obtener todos los usuarios con paginación.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): número de página (default: 1)
- `size` (optional): elementos por página (default: 10, max: 100)

**Example:** `/api/users?page=1&size=10`

**Response 200:**
```json
{
  "users": [
    {
      "id": "uuid",
      "fullName": "string",
      "email": "string",
      "role": "cashier" | "admin",
      "active": true,
      "createdAt": "ISO_date_string",
      "lastSession": "ISO_date_string"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

#### GET `/api/users/:id` 🔒 Admin or Self
Obtener usuario por ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id`: UUID del usuario

**Response 200:**
```json
{
  "id": "uuid",
  "fullName": "string",
  "email": "string",
  "role": "cashier" | "admin",
  "active": true,
  "createdAt": "ISO_date_string",
  "lastSession": "ISO_date_string"
}
```

**Errors:**
- `404` - User not found
- `403` - Not authorized (only admin or the user themselves)

---

#### PUT `/api/users/:id` 🔒 Admin or Self
Actualizar usuario.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id`: UUID del usuario

**Body:**
```json
{
  "fullName": "string (optional)",
  "email": "valid_email@domain.com (optional)",
  "role": "cashier" | "admin" (optional)",
  "active": true | false (optional)
}
```

**Response 200:**
```json
{
  "message": "Usuario actualizado exitosamente",
  "user": {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "role": "cashier" | "admin",
    "active": true,
    "createdAt": "ISO_date_string",
    "lastSession": "ISO_date_string"
  }
}
```

---

#### PATCH `/api/users/:id/deactivate` 🔒 Admin Only
Desactivar usuario.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id`: UUID del usuario

**Response 200:**
```json
{
  "message": "Usuario desactivado exitosamente",
  "id": "uuid"
}
```

**Errors:**
- `400` - Cannot deactivate own admin account

---

#### DELETE `/api/users/:id` 🔒 Admin Only
Eliminar usuario permanentemente.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id`: UUID del usuario

**Response 200:**
```json
{
  "message": "Usuario eliminado exitosamente",
  "id": "uuid"
}
```

**Errors:**
- `400` - Cannot delete own admin account

---

## 📦 Products Endpoints

### GET `/api/products`
Obtener todos los productos con paginación y filtrado.

**Query Parameters:**
- `page` (optional): número de página (default: 1)
- `limit` (optional): elementos por página (default: 10)
- `category` (optional): filtrar por categoría

**Example:** `/api/products?page=1&limit=10&category=medicamentos`

**Response 200:**
```json
{
  "products": [
    {
      "_id": "uuid",
      "name": "string",
      "description": "string",
      "price": number,
      "stock": number,
      "category": "string",
      "createdAt": timestamp,
      "updatedAt": timestamp
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

---

### GET `/api/products/search`
Buscar productos por nombre o categoría.

**Query Parameters:**
- `query`: término de búsqueda (required)

**Example:** `/api/products/search?query=aspirina`

---

### GET `/api/products/:id`
Obtener producto por ID.

---

### POST `/api/products`
Crear nuevo producto.

---

### PUT `/api/products/:id`
Actualizar producto.

---

### DELETE `/api/products/:id`
Eliminar producto.

---

## 🔐 Default Users

### Administrator
- **Email:** `admin@farmaapp.com`
- **Password:** `admin123`
- **Role:** `admin`

### Example Cashier (if created)
- **Email:** `cajero@farmaapp.com`  
- **Password:** `cajero123`
- **Role:** `cashier`

---

## 🚨 Error Responses

### Common Error Format
```json
{
  "message": "Error description",
  "error": "detailed_error_message (optional)"
}
```

### Validation Error Format
```json
{
  "message": "Errores de validación",
  "errors": [
    {
      "field": "email",
      "message": "Debe ser un email válido"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error
