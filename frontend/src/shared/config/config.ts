// Configuración de la aplicación frontend
export const config = {
  // Modo de la aplicación: 'local' usa RxDB/LevelDB, 'deploy' usa Firestore
  APP_MODE: 'local',
  
  
  // Configuración de la aplicación
  APP: {
    NAME: 'FarmaApp',
    VERSION: '1.0.10',
  },
  
  // Configuración de tokens
  TOKEN: {
    STORAGE_KEY: 'farmaapp_token',
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos en ms
  },
  
  // Configuración de base de datos local
  DB: {
    NAME: 'somostotal_db_v19',
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
  },

  // Configuración de replicación
  REPLICATION: {
    ENABLED: import.meta.env.VITE_REPLICATION_ENABLED !== 'false', // true por defecto
    BATCH_SIZE: parseInt(import.meta.env.VITE_REPLICATION_BATCH_SIZE || '25'),
    REAL_TIME: true, // true por defecto
    RETRY_INTERVAL: parseInt(import.meta.env.VITE_REPLICATION_RETRY_INTERVAL || '5000'), // 5 segundos
  },

  // Configuración de inventario y lotes
  INVENTORY: {
    EXPIRING_SOON_DAYS: 90, // Días para considerar "próximo a vencer"
  }
};


