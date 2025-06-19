# FarmaApp Backend

## Project Description
FarmaApp is a comprehensive pharmacy management system designed to streamline operations for small to medium-sized pharmacies. This backend application provides the API services for inventory management, user authentication, and sales processing.

## Technologies Used

### Core Technologies
- **TypeScript**: Strongly typed programming language that builds on JavaScript
- **Express.js**: Web application framework for Node.js
- **Node.js**: JavaScript runtime environment

### Database
- **RxDB**: A NoSQL client-side database that provides:
  - Real-time synchronization capabilities
  - Offline-first approach
  - Document-based storage model
  - Schema validation
  - Reactive queries
  
RxDB was chosen for this project because it offers robust offline capabilities, which are crucial for pharmacy applications in areas with unreliable internet connections. The reactive nature of RxDB also allows for real-time updates across multiple devices, making it ideal for environments where multiple staff members need to access and update information simultaneously.

### Authentication & Security
- **JWT (JSON Web Tokens)**: For secure authentication
- **bcrypt**: For password hashing

## API Endpoints

### User Management

#### Register User
- **Endpoint**: `POST /api/users/register`
- **Description**: Creates a new user in the system
- **Request Body**:
  ```json
  {
    "fullName": "User Full Name",
    "email": "user@example.com",
    "password": "securePassword",
    "role": "admin | cashier"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Usuario registrado exitosamente",
    "user": {
      "id": "uuid",
      "fullName": "User Full Name",
      "email": "user@example.com",
      "role": "admin | cashier",
      "active": true,
      "createdAt": "ISO date string"
    }
  }
  ```

#### User Login
- **Endpoint**: `POST /api/users/login`
- **Description**: Authenticates a user and returns a JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Login exitoso",
    "token": "JWT token",
    "user": {
      "id": "uuid",
      "fullName": "User Full Name",
      "email": "user@example.com",
      "role": "admin | cashier",
      "active": true,
      "createdAt": "ISO date string",
      "lastSession": "ISO date string"
    }
  }
  ```

## Getting Started

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Default Admin Account
The system automatically creates a default admin account on first run:
- Email: admin@farmaapp.com
- Password: admin123

**Important**: Change this password in production environments.