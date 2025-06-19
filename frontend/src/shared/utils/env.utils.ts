// Utilidad para mostrar información de configuración
export const showEnvironmentInfo = () => {
  const config = {
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    appMode: import.meta.env.VITE_APP_MODE,
    debug: import.meta.env.VITE_DEBUG,
    logLevel: import.meta.env.VITE_LOG_LEVEL,
    jwtSecret: import.meta.env.VITE_JWT_SECRET?.substring(0, 20) + '...',
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
  };

  console.group('🔧 CONFIGURACIÓN DE ENTORNO');
  console.log('Modo Vite:', config.mode);
  console.log('Modo App (VITE_APP_MODE):', config.appMode);
  console.log('Debug habilitado:', config.debug);
  console.log('Nivel de log:', config.logLevel);
  console.log('JWT Secret:', config.jwtSecret);
  console.log('Firebase Project ID:', config.firebaseProjectId);
  
  // Determinar qué archivo .env se está usando
  let envFile = '.env';
  if (config.debug === 'true') {
    if (config.jwtSecret?.includes('local_mode')) {
      envFile = '.env.development';
    } else if (config.jwtSecret?.includes('local')) {
      envFile = '.env.local';
    }
  }
  
  console.log('Archivo .env detectado:', envFile);
  
  // Mostrar estado de la base de datos
  const dbMode = config.appMode === 'local' ? 'RxDB + IndexedDB + Firestore backup' : 'Solo Firestore';
  console.log('Modo de base de datos:', dbMode);
  
  console.groupEnd();

  return config;
};

// Auto-ejecutar solo en desarrollo
if (import.meta.env.DEV) {
  showEnvironmentInfo();
}
