// Configuración de seguridad para producción
export const securityConfig = {
  // Validación de JWT secret
  validateJWTSecret: () => {
    const secret = import.meta.env.VITE_JWT_SECRET;
    
    if (import.meta.env.PROD) {
      // En producción, el secret debe ser fuerte
      if (!secret || secret.length < 32) {
        throw new Error('JWT Secret debe tener al menos 32 caracteres en producción');
      }
      
      if (secret.includes('development') || secret.includes('demo')) {
        throw new Error('No puedes usar JWT secrets de desarrollo en producción');
      }
    }
    
    return secret;
  },
  
  // Configuración de Firebase para producción
  validateFirebaseConfig: () => {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    
    if (import.meta.env.PROD) {
      // Validar que no sean valores de demo
      const isDemoConfig = Object.values(config).some(value => 
        value?.includes('demo') || value?.includes('example')
      );
      
      if (isDemoConfig) {
        throw new Error('No puedes usar configuración de Firebase de demo en producción');
      }
    }
    
    return config;
  },
  
  // Deshabilitar logs sensibles en producción
  setupLogging: () => {
    if (import.meta.env.PROD) {
      // Sobrescribir console.log para evitar logs sensibles
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        // Filtrar logs que contengan información sensible
        const sensitiveKeywords = ['password', 'token', 'secret', 'key'];
        const logString = args.join(' ').toLowerCase();
        
        const hasSensitiveInfo = sensitiveKeywords.some(keyword => 
          logString.includes(keyword)
        );
        
        if (!hasSensitiveInfo) {
          originalLog.apply(console, args);
        }
      };
    }
  }
};

// Inicializar configuración de seguridad
export const initSecurity = () => {
  try {
    securityConfig.validateJWTSecret();
    securityConfig.validateFirebaseConfig();
    securityConfig.setupLogging();
    
    if (import.meta.env.PROD) {
      console.log('🔒 Configuración de seguridad validada para producción');
    }
  } catch (error) {
    console.error('❌ Error de configuración de seguridad:', error);
    throw error;
  }
};
