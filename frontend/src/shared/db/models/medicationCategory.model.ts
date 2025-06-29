import type { RxJsonSchema, RxDatabase, RxCollection } from 'rxdb';
import type { MedicationCategory } from '../../types/Medication';
import { config } from '../../config/config';

// Esquema RxDB para MedicationCategory
export const medicationCategorySchema: RxJsonSchema<MedicationCategory> = {
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
    description: {
      type: 'string',
      maxLength: 500
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

export type MedicationCategoryCollection = RxCollection<MedicationCategory>;

// Implementación para RxDB local
export class LocalMedicationCategoryDB {
  private collection?: MedicationCategoryCollection;
  private initialized = false;

  async init(db: RxDatabase): Promise<void> {
    // La colección ya fue creada en initDatabase, solo obtenemos la referencia
    this.collection = db.collections.medication_categories as MedicationCategoryCollection;
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

  async create(data: Omit<MedicationCategory, 'id'> & { id: string }): Promise<MedicationCategory> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.insert(data);
    return JSON.parse(JSON.stringify(doc.toJSON())) as MedicationCategory;
  }

  async findById(id: string): Promise<MedicationCategory | null> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as MedicationCategory : null;
  }

  async findAll(): Promise<MedicationCategory[]> {
    await this.ensureInitialized();
    
    const docs = await this.collection!.find().exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as MedicationCategory);
  }

  async findByName(name: string): Promise<MedicationCategory | null> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.findOne({
      selector: { name: { $eq: name } }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as MedicationCategory : null;
  }

  async update(id: string, data: Partial<MedicationCategory>): Promise<MedicationCategory> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.findOne(id).exec();
    if (!doc) throw new Error('MedicationCategory not found');
    
    await doc.update({
      $set: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as MedicationCategory;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const doc = await this.collection!.findOne(id).exec();
    if (!doc) return false;
    
    await doc.remove();
    return true;
  }

  async search(query: string): Promise<MedicationCategory[]> {
    await this.ensureInitialized();
    
    const docs = await this.collection!.find({
      selector: {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }
    }).exec();
    
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as MedicationCategory);
  }
}

// Implementación para Firestore (placeholder)
export class FirestoreMedicationCategoryDB {
  async create(_data: Omit<MedicationCategory, 'id'> & { id: string }): Promise<MedicationCategory> {
    throw new Error('Firestore implementation not yet available');
  }

  async findById(_id: string): Promise<MedicationCategory | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findAll(): Promise<MedicationCategory[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByName(_name: string): Promise<MedicationCategory | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async update(_id: string, _data: Partial<MedicationCategory>): Promise<MedicationCategory> {
    throw new Error('Firestore implementation not yet available');
  }

  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }

  async search(_query: string): Promise<MedicationCategory[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

// Selector de base de datos según el modo
const getMedicationCategoryDB = () => {
  return config.APP_MODE === 'local' ? localMedicationCategoryDB : firestoreMedicationCategoryDB;
};

// Instancias
export const localMedicationCategoryDB = new LocalMedicationCategoryDB();
export const firestoreMedicationCategoryDB = new FirestoreMedicationCategoryDB();
export { getMedicationCategoryDB };
