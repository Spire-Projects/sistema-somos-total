// Configuración de la aplicación frontend
export const config = {
  // Modo de la aplicación: 'local' usa RxDB/LevelDB, 'deploy' usa Firestore
  APP_MODE: import.meta.env.VITE_APP_MODE || 'local',
  
  // URL base del backend - puerto 3000 por defecto (solo para modo deploy o legacy)
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // URLs específicas de la API (legacy)
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
  },
  
  // Configuración de base de datos local
  DB: {
    NAME: 'farmaapp_db',
    PATH: './data/rxdb',
    VERSION: 1,
  },
  
  // Configuración de Firebase/Firestore
  FIREBASE: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
};

// URLs completas de la API
export const API_URLS = {
  AUTH: `${config.API_BASE_URL}${config.API.AUTH}`,
  PRODUCTS: `${config.API_BASE_URL}${config.API.PRODUCTS}`,
};
