import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { setupDatabase, dbHelpers, closeDatabase } from './db/database.js';
import { productRoutes } from './routes/product.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { config } from './config/config.js';
import { hashPassword } from './utils/auth.utils.js';
import { v4 as uuidv4 } from 'uuid';
// Función para inicializar datos por defecto
const initializeDefaultData = async () => {
    try {
        console.log('Verificando datos por defecto...');
        // Verificar si ya existe un usuario administrador
        const existingAdmin = await dbHelpers.users.getByEmail('admin@farmaapp.com');
        if (!existingAdmin) {
            console.log('Creando usuario administrador por defecto...');
            // Crear usuario administrador por defecto
            const adminPassword = await hashPassword('admin123');
            const adminUser = {
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
        }
        else {
            console.log('Usuario administrador ya existe.');
        }
        console.log('Inicialización de datos completada.');
    }
    catch (error) {
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
app.use('/api/users', userRoutes);
// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenido a la API de FarmaApp',
        version: '1.0.0',
        status: 'online'
    });
});
// Iniciar el servidor
const server = app.listen(config.port, () => {
    console.log(`Servidor corriendo en http://localhost:${config.port}`);
});
// Variable para controlar si ya se está cerrando
let isShuttingDown = false;
// Función para manejar el cierre limpio
async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        console.log('Ya se está cerrando la aplicación...');
        return;
    }
    isShuttingDown = true;
    console.log(`Recibida señal ${signal}. Cerrando aplicación gracefully...`);
    // Cerrar el servidor HTTP
    server.close(async () => {
        console.log('Servidor HTTP cerrado');
        // Cerrar conexiones de base de datos
        await closeDatabase();
        console.log('Aplicación cerrada correctamente');
        process.exit(0);
    });
    // Forzar cierre después de 10 segundos si no se cierra naturalmente
    setTimeout(() => {
        console.error('Forzando cierre de la aplicación...');
        process.exit(1);
    }, 10000);
}
// Manejar señales de cierre
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
export { app, collections };
