import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { setupDatabase, dbHelpers } from './db/database.js';
import { productRoutes } from './routes/product.routes.js';
import { config } from './config/config.js';
import { hashPassword, verifyPassword, generateToken } from './utils/auth.utils.js';
import { v4 as uuidv4 } from 'uuid';
import { User } from './models/user.model.js';

// Función para inicializar datos por defecto
const initializeDefaultData = async (): Promise<void> => {
  try {
    console.log('Verificando datos por defecto...');
    
    // Verificar si ya existe un usuario administrador
    const existingAdmin = await dbHelpers.users.getByEmail('admin@farmaapp.com');
    
    if (!existingAdmin) {
      console.log('Creando usuario administrador por defecto...');
      
      // Crear usuario administrador por defecto
      const adminPassword = await hashPassword('admin123');
      const adminUser: User = {
        id: uuidv4(),
        fullName: 'Administrador del Sistema',
        email: 'admin@farmaapp.com',
        passwordHash: adminPassword,
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString()
      };

      await dbHelpers.users.create(adminUser);
      console.log('Usuario administrador creado:');
      console.log('Email: admin@farmaapp.com');
      console.log('Contraseña: admin123');
      console.log('¡IMPORTANTE: Cambia esta contraseña en producción!');
    } else {
      console.log('Usuario administrador ya existe.');
    }

    console.log('Inicialización de datos completada.');
  } catch (error) {
    console.error('Error al inicializar datos por defecto:', error);
    throw error;
  }
};

// Inicializar la base de datos
const collections = await setupDatabase();

// Inicializar datos por defecto
await initializeDefaultData();

// Crear la aplicación Express
const app = express();

// Configurar middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Configurar las rutas
app.use('/api/products', productRoutes);

// Rutas de usuarios integradas directamente
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos' });
      return;
    }

    // Buscar el usuario por email
    const user = await dbHelpers.users.getByEmail(email);
    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Verificar si el usuario está activo
    if (!user.active) {
      res.status(401).json({ message: 'Usuario desactivado' });
      return;
    }

    // Verificar la contraseña
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Actualizar última sesión
    await dbHelpers.users.update(user.id, {
      lastSession: new Date().toISOString()
    });

    // Generar token JWT
    const authUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      active: user.active
    };

    const token = generateToken(authUser);

    // Remover la contraseña de la respuesta
    const { passwordHash: _, ...userResponse } = user;

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error al hacer login:', error);
    res.status(500).json({
      message: 'Error al hacer login',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validaciones básicas
    if (!fullName || !email || !password || !role) {
      res.status(400).json({ message: 'Todos los campos son requeridos' });
      return;
    }

    if (!['cashier', 'admin'].includes(role)) {
      res.status(400).json({ message: 'El rol debe ser "cashier" o "admin"' });
      return;
    }

    // Verificar si el email ya existe
    const existingUser = await dbHelpers.users.getByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: 'El email ya está registrado' });
      return;
    }

    // Encriptar la contraseña
    const passwordHash = await hashPassword(password);

    // Crear el nuevo usuario
    const newUser: User = {
      id: uuidv4(),
      fullName,
      email,
      passwordHash,
      role,
      active: true,
      createdAt: new Date().toISOString()
    };

    await dbHelpers.users.create(newUser);

    // Remover la contraseña de la respuesta
    const { passwordHash: _, ...userResponse } = newUser;
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userResponse
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      message: 'Error al registrar usuario',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a la API de FarmaApp',
    version: '1.0.0',
    status: 'online'
  });
});

// Iniciar el servidor
app.listen(config.port, () => {
  console.log(`Servidor corriendo en http://localhost:${config.port}`);
});

// Manejar cierre de la aplicación
process.on('SIGINT', async () => {
  console.log('Cerrando aplicación...');
  process.exit(0);
});

export { app, collections };
