import type { RxJsonSchema, RxDatabase, RxCollection } from 'rxdb';
import type { PharmaceuticalFormDoc } from '../../types/Medication';
import { config } from '../../config/config';

// Esquema RxDB para PharmaceuticalForm
export const pharmaceuticalFormSchema: RxJsonSchema<PharmaceuticalFormDoc> = {
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
    },
    sincronized: {
      type: 'boolean'
    },
    isDeleted: {
      type: 'boolean'
    }
  },
  required: ['id', 'name'],
  indexes: ['name', 'createdAt']
};

export type PharmaceuticalFormCollection = RxCollection<PharmaceuticalFormDoc>;

// Implementación para RxDB local
export class LocalPharmaceuticalFormDB {
  private collection?: PharmaceuticalFormCollection;

  async init(db: RxDatabase): Promise<void> {
    // La colección ya fue creada en initDatabase, solo obtenemos la referencia
    this.collection = db.collections.pharmaceutical_forms as PharmaceuticalFormCollection;
  }

  async create(data: Omit<PharmaceuticalFormDoc, 'id'> & { id: string }): Promise<PharmaceuticalFormDoc> {
    if (!this.collection) throw new Error('PharmaceuticalForm collection not initialized');
    
    const doc = await this.collection.insert(data);
    return JSON.parse(JSON.stringify(doc.toJSON())) as PharmaceuticalFormDoc;
  }

  async findById(id: string): Promise<PharmaceuticalFormDoc | null> {
    if (!this.collection) throw new Error('PharmaceuticalForm collection not initialized');
    
    const doc = await this.collection.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as PharmaceuticalFormDoc : null;
  }

  async findAll(): Promise<PharmaceuticalFormDoc[]> {
    if (!this.collection) throw new Error('PharmaceuticalForm collection not initialized');
    
    const docs = await this.collection.find({
      selector: { isDeleted: { $ne: true } }
    }).exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as PharmaceuticalFormDoc);
  }

  async findByName(name: string): Promise<PharmaceuticalFormDoc | null> {
    if (!this.collection) throw new Error('PharmaceuticalForm collection not initialized');
    
    const doc = await this.collection.findOne({
      selector: { 
        name: { $eq: name },
        isDeleted: { $ne: true }
      }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as PharmaceuticalFormDoc : null;
  }

  async update(id: string, data: Partial<PharmaceuticalFormDoc>): Promise<PharmaceuticalFormDoc> {
    if (!this.collection) throw new Error('PharmaceuticalForm collection not initialized');
    
    const doc = await this.collection.findOne(id).exec();
    if (!doc) throw new Error('PharmaceuticalForm not found');
    
    await doc.update({
      $set: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as PharmaceuticalFormDoc;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.collection) throw new Error('PharmaceuticalForm collection not initialized');
    
    const doc = await this.collection.findOne(id).exec();
    if (!doc) return false;
    
    // Soft delete
    await doc.update({
      $set: {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      }
    });
    return true;
  }

  async search(query: string): Promise<PharmaceuticalFormDoc[]> {
    if (!this.collection) throw new Error('PharmaceuticalForm collection not initialized');
    
    const docs = await this.collection.find({
      selector: {
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { aliases: { $elemMatch: { $regex: query, $options: 'i' } } }
            ]
          }
        ]
      }
    }).exec();
    
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as PharmaceuticalFormDoc);
  }
}

// Implementación para Firestore (placeholder)
export class FirestorePharmaceuticalFormDB {
  async create(_data: Omit<PharmaceuticalFormDoc, 'id'> & { id: string }): Promise<PharmaceuticalFormDoc> {
    throw new Error('Firestore implementation not yet available');
  }

  async findById(_id: string): Promise<PharmaceuticalFormDoc | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findAll(): Promise<PharmaceuticalFormDoc[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByName(_name: string): Promise<PharmaceuticalFormDoc | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async update(_id: string, _data: Partial<PharmaceuticalFormDoc>): Promise<PharmaceuticalFormDoc> {
    throw new Error('Firestore implementation not yet available');
  }

  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }

  async search(_query: string): Promise<PharmaceuticalFormDoc[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

// Selector de base de datos según el modo
const getPharmaceuticalFormDB = () => {
  return config.APP_MODE === 'local' ? localPharmaceuticalFormDB : firestorePharmaceuticalFormDB;
};

// Instancias
export const localPharmaceuticalFormDB = new LocalPharmaceuticalFormDB();
export const firestorePharmaceuticalFormDB = new FirestorePharmaceuticalFormDB();
export { getPharmaceuticalFormDB };
