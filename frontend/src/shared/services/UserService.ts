import { config } from '../config/config';
import { getUserRepository } from '../db/repositories/user.repository';
import type {
  UserDocument,
  CreateUserData,
  UpdateUserData,
  LoginCredentials,
} from '../db/models/user.model';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  userToAuthUser,
  isValidEmail,
  isValidPassword,
  storeToken,
  removeStoredToken
} from '../utils/auth.utils';
import type { AuthUser } from '../types/User';

// Selector de base de datos según el modo (repositorio)
const getUserDB = () => getUserRepository();

export const UserService = {
  // Registrar un nuevo usuario
  async register(data: CreateUserData): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
    try {
      // Validaciones
      if (!isValidEmail(data.email)) {
        return { success: false, error: 'Email inválido' };
      }

      const passwordValidation = isValidPassword(data.password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.message };
      }

      // Verificar si el usuario ya existe
      const db = getUserDB();
      const existingUser = await db.findByEmail(data.email);
      if (existingUser) {
        return { success: false, error: 'Ya existe un usuario con este email' };
      }

      // Hash de la contraseña
      const passwordHash = await hashPassword(data.password);

      // Crear el usuario
      const userData: Omit<UserDocument, 'id'> = {
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        role: data.role,
        active: true,
        createdAt: new Date().toISOString()
      };

      const newUser = await db.create(userData);
      const authUser = userToAuthUser(newUser);
      const token = await generateToken(authUser);

      // Almacenar token
      storeToken(token);

      return { success: true, user: authUser, token };
    } catch (error) {
      console.error('Error registrando usuario:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  },

  // Iniciar sesión
  async login(data: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
    try {
      console.log('🔐 Iniciando login para:', data.email);
      
      // Validaciones
      if (!isValidEmail(data.email)) {
        return { success: false, error: 'Email inválido' };
      }

      // Buscar usuario
      const db = getUserDB();
      console.log('📊 Usando base de datos:', config.APP_MODE === 'local' ? 'RxDB/IndexedDB' : 'Firestore');
      
      const user = await db.findByEmail(data.email);
      if (!user) {
        console.log('❌ Usuario no encontrado:', data.email);
        return { success: false, error: 'Credenciales inválidas' };
      }

      console.log('✅ Usuario encontrado:', user.fullName);

      // Verificar si el usuario está activo
      if (!user.active) {
        return { success: false, error: 'Usuario inactivo' };
      }

      // Verificar contraseña
      const isValidPassword = await verifyPassword(data.password, user.passwordHash);
      if (!isValidPassword) {
        console.log('❌ Contraseña incorrecta para:', data.email);
        return { success: false, error: 'Credenciales inválidas' };
      }

      console.log('✅ Contraseña válida, actualizando última sesión...');

      // Actualizar última sesión
      await db.update(user.id, {
        lastSession: new Date().toISOString()
      });

      console.log('✅ Sesión actualizada, generando token...');

      const authUser = userToAuthUser(user);
      const token = await generateToken(authUser);

      // Almacenar token
      storeToken(token);

      console.log('✅ Login exitoso para:', user.fullName);
      return { success: true, user: authUser, token };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  },

  // Cerrar sesión
  async logout(): Promise<void> {
    removeStoredToken();
  },

  // Obtener todos los usuarios (solo para admin)
  async getAllUsers(): Promise<{ success: boolean; users?: AuthUser[]; error?: string }> {
    try {
      const db = getUserDB();
      const users = await db.findAll();
      const authUsers = users.map(userToAuthUser);
      
      return { success: true, users: authUsers };
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return { success: false, error: 'Error obteniendo usuarios' };
    }
  },

  // Obtener usuario por ID
  async getUserById(id: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const db = getUserDB();
      const user = await db.findById(id);
      
      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      return { success: true, user: userToAuthUser(user) };
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return { success: false, error: 'Error obteniendo usuario' };
    }
  },

  // Actualizar usuario
  async updateUser(id: string, data: UpdateUserData): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const db = getUserDB();
      const updatedUser = await db.update(id, data);
      
      if (!updatedUser) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      return { success: true, user: userToAuthUser(updatedUser) };
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      return { success: false, error: 'Error actualizando usuario' };
    }
  },

  // Desactivar usuario
  async deactivateUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = getUserDB();
      const result = await db.update(id, { active: false });
      
      if (!result) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error desactivando usuario:', error);
      return { success: false, error: 'Error desactivando usuario' };
    }
  },

  // Eliminar usuario completamente (elimina el registro de la base de datos)
  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = getUserDB();
      
      // Verificar que el usuario existe antes de intentar eliminarlo
      const user = await db.findById(id);
      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Eliminar el usuario de la base de datos
      const deleteResult = await db.delete(id);
      
      if (!deleteResult) {
        return { success: false, error: 'No se pudo eliminar el usuario' };
      }

      console.log(`✅ Usuario ${user.fullName} (${user.email}) eliminado completamente de la base de datos`);
      return { success: true };
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      return { success: false, error: 'Error eliminando usuario' };
    }
  },

  // Obtener usuarios por rol
  async getUsersByRole(role: string): Promise<{ success: boolean; users?: AuthUser[]; error?: string }> {
    try {
      const db = getUserDB();
      const users = await db.findByRole(role);
      const authUsers = users.map(userToAuthUser);
      
      return { success: true, users: authUsers };
    } catch (error) {
      console.error('Error obteniendo usuarios por rol:', error);
      return { success: false, error: 'Error obteniendo usuarios' };
    }
  },

  // Buscar usuarios por texto (coincidencia parcial en email, nombre o rol)
  async searchUsers(searchText: string): Promise<{ success: boolean; users?: AuthUser[]; error?: string }> {
    try {
      if (!searchText || searchText.trim() === '') {
        return await this.getAllUsers();
      }

      // Normalizar texto de búsqueda
      const normalizedText = searchText.trim().toLowerCase();
      
      // Obtener la base de datos apropiada
      const db = getUserDB();
      
      // Usar el método especializado de búsqueda si estamos en modo local
      let filteredUsers;
      if (config.APP_MODE === 'local' && 'findByText' in db) {
        // Si la base de datos tiene un método findByText, usarlo directamente
        filteredUsers = await db.findByText(normalizedText);
      } else {
        // Si no, usamos el enfoque genérico (compatible con Firestore)
        const allUsers = await db.findAll();
        filteredUsers = allUsers.filter(user => 
          user.email.toLowerCase().includes(normalizedText) ||
          user.fullName.toLowerCase().includes(normalizedText) ||
          user.role.toLowerCase().includes(normalizedText)
        );
      }
      
      const authUsers = filteredUsers.map(userToAuthUser);
      console.log(`🔍 Búsqueda de usuarios: "${searchText}" - ${authUsers.length} resultados`);
      
      return { success: true, users: authUsers };
    } catch (error) {
      console.error('❌ Error buscando usuarios:', error);
      return { success: false, error: 'Error al buscar usuarios' };
    }
  },
};