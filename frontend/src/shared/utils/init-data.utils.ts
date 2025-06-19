import { UserService } from '../services/UserService';
import type { CreateUserData } from '../db/models/user.model';

/**
 * Inicializa datos por defecto en el frontend
 * Crea un usuario administrador si no existe
 */
export const initializeDefaultData = async (): Promise<void> => {
  try {
    console.log('🔧 Verificando datos por defecto...');
    
    // Verificar si ya existen usuarios
    const existingUsers = await UserService.getAllUsers();
    
    if (existingUsers.success && existingUsers.users && existingUsers.users.length > 0) {
      console.log(`✅ Ya existen ${existingUsers.users.length} usuarios en la base de datos`);
      return;
    }
    
    console.log('🚀 Creando usuario administrador por defecto...');
    
    // Crear usuario administrador por defecto
    const adminUserData: CreateUserData = {
      fullName: 'Administrador del Sistema',
      email: 'admin@farmaapp.com',
      password: 'admin123',
      role: 'admin'
    };

    const result = await UserService.register(adminUserData);
    
    if (result.success) {
      console.log('✅ Usuario administrador creado exitosamente:');
      console.log('📧 Email: admin@farmaapp.com');
      console.log('🔑 Contraseña: admin123');
      console.log('⚠️  IMPORTANTE: Cambia esta contraseña en producción!');
    } else {
      console.error('❌ Error creando usuario administrador:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar datos por defecto:', error);
    // No lanzar error para no romper la aplicación
  }
};

/**
 * Verifica si necesita ejecutar la inicialización
 * Solo se ejecuta una vez por sesión
 */
export const checkAndInitializeData = async (): Promise<void> => {
  const initKey = 'farmaapp_data_initialized';
  
  // Verificar si ya se inicializó en esta sesión
  if (sessionStorage.getItem(initKey)) {
    return;
  }
  
  await initializeDefaultData();
  
  // Marcar como inicializado para esta sesión
  sessionStorage.setItem(initKey, 'true');
};
