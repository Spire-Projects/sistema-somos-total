import type { RxJsonSchema, RxDatabase, RxCollection } from 'rxdb';
import type { ActiveIngredient } from '../../types/Medication';
import { config } from '../../config/config';

// Esquema RxDB para ActiveIngredient
export const activeIngredientSchema: RxJsonSchema<ActiveIngredient> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string',
      maxLength: 200
    },
    aliases: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 200
      }
    },
    createdAt: {
      type: 'string',
      maxLength: 50
    },
    createdBy: {
      type: 'string',
      maxLength: 100
    }
  },
  required: ['id', 'name'],
  indexes: ['name', 'createdAt']
};

export type ActiveIngredientCollection = RxCollection<ActiveIngredient>;

// Implementación para RxDB local
export class LocalActiveIngredientDB {
  private collection?: ActiveIngredientCollection;
  private initialized = false;

  async init(db: RxDatabase): Promise<void> {
    // La colección ya fue creada en initDatabase, solo obtenemos la referencia
    this.collection = db.collections.active_ingredients as ActiveIngredientCollection;
    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.collection) {
      const { getDatabase } = await import('../database');
      const db = getDatabase();
      if (!db) {
        throw new Error('Database not initialized. Please call initDatabase() first.');
      }
      await this.init(db as any);
    }
  }

  async create(data: Omit<ActiveIngredient, 'id'> & { id: string }): Promise<ActiveIngredient> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.insert(data);
    return JSON.parse(JSON.stringify(doc.toJSON())) as ActiveIngredient;
  }

  async findById(id: string): Promise<ActiveIngredient | null> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as ActiveIngredient : null;
  }

  async findAll(): Promise<ActiveIngredient[]> {
    await this.ensureInitialized();
    
    const docs = await this.collection!.find().exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as ActiveIngredient);
  }

  async findByName(name: string): Promise<ActiveIngredient | null> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.findOne({
      selector: { name: { $eq: name } }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as ActiveIngredient : null;
  }

  async update(id: string, data: Partial<ActiveIngredient>): Promise<ActiveIngredient> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.findOne(id).exec();
    if (!doc) throw new Error('ActiveIngredient not found');
    
    await doc.update({
      $set: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as ActiveIngredient;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.findOne(id).exec();
    if (!doc) return false;
    
    await doc.remove();
    return true;
  }

  async search(query: string): Promise<ActiveIngredient[]> {
    await this.ensureInitialized();
    
    const docs = await this.collection!.find({
      selector: {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { aliases: { $elemMatch: { $regex: query, $options: 'i' } } }
        ]
      }
    }).exec();
    
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as ActiveIngredient);
  }
}

// Implementación para Firestore (placeholder)
export class FirestoreActiveIngredientDB {
  async create(_data: Omit<ActiveIngredient, 'id'> & { id: string }): Promise<ActiveIngredient> {
    throw new Error('Firestore implementation not yet available');
  }

  async findById(_id: string): Promise<ActiveIngredient | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findAll(): Promise<ActiveIngredient[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByName(_name: string): Promise<ActiveIngredient | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async update(_id: string, _data: Partial<ActiveIngredient>): Promise<ActiveIngredient> {
    throw new Error('Firestore implementation not yet available');
  }

  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }

  async search(_query: string): Promise<ActiveIngredient[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

// Selector de base de datos según el modo
const getActiveIngredientDB = () => {
  return config.APP_MODE === 'local' ? localActiveIngredientDB : firestoreActiveIngredientDB;
};

// Instancias
export const localActiveIngredientDB = new LocalActiveIngredientDB();
export const firestoreActiveIngredientDB = new FirestoreActiveIngredientDB();
export { getActiveIngredientDB };
