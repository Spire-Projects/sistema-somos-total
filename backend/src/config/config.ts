import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual para manejar rutas relativas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la aplicación
export const config = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || path.join(__dirname, '../../data/rxdb'),
  dbName: 'farmaapp',
  // Otras configuraciones que puedas necesitar
};
