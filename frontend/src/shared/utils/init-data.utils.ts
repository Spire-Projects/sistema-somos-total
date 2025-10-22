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
      email: 'administrador@somostotal.com',
      password: 'admin123',
      role: 'admin'
    };

    const result = await UserService.register(adminUserData);
    if (result.success) {
      console.log('✅ Usuario administrador creado con éxito:', result.user);
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar datos por defecto:', error);
   
  }
};


export const checkAndInitializeData = async (): Promise<void> => {
  const initKey = 'somosTotalDataInitialized';
  
  await initializeDefaultData();
  sessionStorage.setItem(initKey, 'true');
};

