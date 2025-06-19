// Script temporal para mostrar la configuración cargada
console.log('=== CONFIGURACIÓN DE ENTORNO CARGADA ===');
console.log('NODE_ENV:', import.meta.env.MODE);
console.log('VITE_APP_MODE:', import.meta.env.VITE_APP_MODE);
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('VITE_JWT_SECRET:', import.meta.env.VITE_JWT_SECRET?.substring(0, 10) + '...');
console.log('VITE_DEBUG:', import.meta.env.VITE_DEBUG);
console.log('VITE_LOG_LEVEL:', import.meta.env.VITE_LOG_LEVEL);
console.log('=========================================');

// Detectar qué archivo .env se está usando
const envDetails = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  appMode: import.meta.env.VITE_APP_MODE,
  jwtSecret: import.meta.env.VITE_JWT_SECRET?.includes('development') ? 'development' : 'production/custom',
  hasDebugFlag: import.meta.env.VITE_DEBUG !== undefined
};

console.log('Detalles del entorno:', envDetails);

// Jerarquía de archivos .env en Vite:
// 1. .env.local (siempre cargado, excepto en test)
// 2. .env.[mode].local (ej: .env.development.local)
// 3. .env.[mode] (ej: .env.development, .env.production)
// 4. .env

if (envDetails.hasDebugFlag) {
  console.log('🔧 Se está usando .env.local (tiene VITE_DEBUG)');
} else if (envDetails.jwtSecret === 'development') {
  console.log('📝 Se está usando .env (configuración base de desarrollo)');
} else {
  console.log('🚀 Se está usando .env.production o configuración personalizada');
}

export {};
