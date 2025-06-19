import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { setupDatabase } from './db/database.js';
import { productRoutes } from './routes/product.routes.js';
import { config } from './config/config.js';

// Inicializar la base de datos
const collections = await setupDatabase();

// Crear la aplicación Express
const app = express();

// Configurar middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Configurar las rutas
app.use('/api/products', productRoutes);

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
