import { createRxDatabase, addRxPlugin } from 'rxdb';
import type { RxDatabase, RxCollection } from 'rxdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { userSchema } from './models/user.model';
import type { UserDocument } from './models/user.model';
import { config } from '../config/config';

// Configurar plugins según entorno
const setupRxDBPlugins = async () => {
  // Plugins básicos siempre necesarios
  addRxPlugin(RxDBQueryBuilderPlugin);
  addRxPlugin(RxDBUpdatePlugin);
  
  if (import.meta.env.DEV) {
    // Solo en desarrollo: cargar dev-mode para debugging
    const { RxDBDevModePlugin, disableWarnings } = await import('rxdb/plugins/dev-mode');
    addRxPlugin(RxDBDevModePlugin);
    
    // Deshabilitar solo las advertencias molestas, mantener validaciones
    disableWarnings();
    
    console.log('🛠️ RxDB Dev-Mode activado para desarrollo');
  } else {
    console.log('🚀 RxDB en modo producción - máximo performance');
  }
};

// Tipos para las colecciones
export interface DatabaseCollections {
  users: RxCollection<UserDocument>;
}

let dbInstance: RxDatabase<DatabaseCollections> | null = null;

// Inicializar la base de datos RxDB
export async function initDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    console.log('🔄 Configurando RxDB...');
    
    // Configurar plugins antes de crear la DB
    await setupRxDBPlugins();
    
    console.log('📱 Inicializando base de datos RxDB con IndexedDB...');
    
    // Crear la base de datos
    const db = await createRxDatabase<DatabaseCollections>({
      name: config.DB.NAME,
      storage: getRxStorageDexie(),
      ignoreDuplicate: true
    });

    console.log('Base de datos creada, agregando colecciones...');

    // Agregar colección de usuarios
    await db.addCollections({
      users: {
        schema: userSchema
      }
    });

    dbInstance = db;
    console.log('Base de datos RxDB inicializada correctamente');
    
    return db;
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    throw error;
  }
}

// Obtener la instancia de la base de datos
export function getDatabase(): RxDatabase<DatabaseCollections> | null {
  return dbInstance;
}

// Cerrar la base de datos
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    console.log('Base de datos cerrada');
  }
}

// Funciones específicas para usuarios usando RxDB
export const localUserDB = {
  // Crear un usuario
  async create(userData: Omit<UserDocument, 'id'>): Promise<UserDocument> {
    const db = await initDatabase();
    const id = crypto.randomUUID();
    
    const user = await db.users.insert({
      id,
      ...userData
    });
    
    return user.toJSON();
  },

  // Buscar usuario por email
  async findByEmail(email: string): Promise<UserDocument | null> {
    const db = await initDatabase();
    const user = await db.users.findOne({
      selector: { email }
    }).exec();
    
    return user ? user.toJSON() : null;
  },

  // Buscar usuario por ID
  async findById(id: string): Promise<UserDocument | null> {
    const db = await initDatabase();
    const user = await db.users.findOne(id).exec();
    
    return user ? user.toJSON() : null;
  },

  // Obtener todos los usuarios
  async findAll(): Promise<UserDocument[]> {
    const db = await initDatabase();
    const users = await db.users.find().exec();
    
    return users.map(user => user.toJSON());
  },

  // Actualizar un usuario
  async update(id: string, updateData: Partial<UserDocument>): Promise<UserDocument | null> {
    const db = await initDatabase();
    const user = await db.users.findOne(id).exec();
    
    if (!user) {
      return null;
    }

    await user.update({
      $set: updateData
    });
    
    return user.toJSON();
  },

  // Eliminar un usuario
  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const user = await db.users.findOne(id).exec();
    
    if (!user) {
      return false;
    }

    await user.remove();
    return true;
  },

  // Buscar usuarios por rol
  async findByRole(role: string): Promise<UserDocument[]> {
    const db = await initDatabase();
    const users = await db.users.find({
      selector: { role: role as any }
    }).exec();
    
    return users.map(user => user.toJSON());
  },

  // Buscar usuarios activos
  async findActive(): Promise<UserDocument[]> {
    const db = await initDatabase();
    const users = await db.users.find({
      selector: { active: true }
    }).exec();
    
    return users.map(user => user.toJSON());
  },

  // Obtener estadísticas de la base de datos
  async getStats(): Promise<{ total: number; active: number; byRole: Record<string, number> }> {
    const db = await initDatabase();
    const allUsers = await db.users.find().exec();
    
    const users = allUsers.map(u => u.toJSON());
    const stats = {
      total: users.length,
      active: users.filter(u => u.active).length,
      byRole: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return stats;
  }
};
