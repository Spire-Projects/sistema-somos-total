import { createRxDatabase, addRxPlugin } from 'rxdb';
import type { RxDatabase, RxCollection } from 'rxdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { userSchema } from './models/user.model';
import type { UserDocument } from './models/user.model';
import { activeIngredientSchema } from './models/activeIngredient.model';
import { medicationCategorySchema } from './models/medicationCategory.model';
import { pharmaceuticalFormSchema } from './models/pharmaceuticalForm.model';
import { manufacturerSchema } from './models/manufacturer.model';
import { medicationSchema } from './models/medication.model';
import type { 
  ActiveIngredient, 
  MedicationCategory, 
  PharmaceuticalFormDoc, 
  Manufacturer,
  Medication
} from '../types/Medication';
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
  active_ingredients: RxCollection<ActiveIngredient>;
  medication_categories: RxCollection<MedicationCategory>;
  pharmaceutical_forms: RxCollection<PharmaceuticalFormDoc>;
  manufacturers: RxCollection<Manufacturer>;
  medications: RxCollection<Medication>;
}

let dbInstance: RxDatabase<DatabaseCollections> | null = null;
let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null;

// Inicializar la base de datos RxDB
export async function initDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  if (dbInstance) {
    return dbInstance;
  }

  // Si ya hay una inicialización en progreso, esperar a que termine
  if (dbPromise) {
    return dbPromise;
  }

  // Si ya hay una inicialización en progreso, esperar a que termine
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
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

      // Agregar todas las colecciones
      await db.addCollections({
        users: {
          schema: userSchema
        },
        active_ingredients: {
          schema: activeIngredientSchema
        },
        medication_categories: {
          schema: medicationCategorySchema
        },
        pharmaceutical_forms: {
          schema: pharmaceuticalFormSchema
        },
        manufacturers: {
          schema: manufacturerSchema
        },
        medications: {
          schema: medicationSchema
        }
      });

      dbInstance = db;
      console.log('✅ Base de datos RxDB inicializada correctamente');
      
      return db;
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      dbPromise = null; // Reset para permitir reintento
      throw error;
    }
  })();

  return dbPromise;
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
    dbPromise = null;
    console.log('Base de datos cerrada');
  }
}

// Variable para controlar si los modelos ya fueron inicializados
let modelsInitialized = false;

// Inicializar completamente la base de datos y los modelos
export async function initDatabaseAndModels(): Promise<RxDatabase<DatabaseCollections>> {
  const db = await initDatabase();
  
  if (!modelsInitialized) {
    console.log('🔄 Inicializando modelos de base de datos...');
    
    // Importar dinámicamente para evitar dependencias circulares
    const [
      { localActiveIngredientDB },
      { localMedicationCategoryDB },
      { localPharmaceuticalFormDB },
      { localManufacturerDB },
      { localMedicationDB }
    ] = await Promise.all([
      import('./models/activeIngredient.model'),
      import('./models/medicationCategory.model'),
      import('./models/pharmaceuticalForm.model'),
      import('./models/manufacturer.model'),
      import('./models/medication.model')
    ]);

    // Inicializar todos los modelos
    await Promise.all([
      localActiveIngredientDB.init(db as any),
      localMedicationCategoryDB.init(db as any),
      localPharmaceuticalFormDB.init(db as any),
      localManufacturerDB.init(db as any),
      localMedicationDB.init(db as any)
    ]);
    
    modelsInitialized = true;
    console.log('✅ Modelos de base de datos inicializados');
  }
  
  return db;
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
  
  // Búsqueda avanzada por texto (aprovechando capacidades de RxDB)
  async findByText(searchText: string): Promise<UserDocument[]> {
    if (!searchText || searchText.trim() === '') {
      return this.findAll();
    }
    
    const db = await initDatabase();
    const normalizedText = searchText.trim().toLowerCase();
    
    // Obtenemos todos los usuarios y filtramos en memoria
    // Esta es una solución más compatible que funcionará siempre
    const allUsers = await db.users.find().exec();
    
    // Filtramos usuarios que coincidan con el texto en cualquier campo
    const filteredUsers = allUsers.filter(user => {
      const userJson = user.toJSON();
      return (
        userJson.email.toLowerCase().includes(normalizedText) ||
        userJson.fullName.toLowerCase().includes(normalizedText) ||
        userJson.role.toLowerCase().includes(normalizedText)
      );
    });
    
    return filteredUsers.map(user => user.toJSON());
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
