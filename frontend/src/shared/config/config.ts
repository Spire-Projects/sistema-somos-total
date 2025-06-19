// Configuración de la aplicación frontend
export const config = {
  // URL base del backend - puerto 3000 por defecto
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // URLs específicas de la API
  API: {
    AUTH: '/api/users',
    PRODUCTS: '/api/products',
  },
  
  // Configuración de la aplicación
  APP: {
    NAME: 'FarmaApp',
    VERSION: '1.0.0',
  },
  
  // Configuración de tokens
  TOKEN: {
    STORAGE_KEY: 'farmaapp_token',
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos en ms
  }
};

// URLs completas de la API
export const API_URLS = {
  AUTH: `${config.API_BASE_URL}${config.API.AUTH}`,
  PRODUCTS: `${config.API_BASE_URL}${config.API.PRODUCTS}`,
};
