import type { RxJsonSchema, RxDatabase, RxCollection } from 'rxdb';
import type { Manufacturer } from '../../types/Medication';
import { config } from '../../config/config';

// Esquema RxDB para Manufacturer
export const manufacturerSchema: RxJsonSchema<Manufacturer> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string'
    },
    country: {
      type: 'string'
    },
    website: {
      type: 'string'
    },
    contactEmail: {
      type: 'string'
    },
    createdAt: {
      type: 'string'
    },
    createdBy: {
      type: 'string'
    },
    sincronized: {
      type: 'boolean'
    },
    deleted: {
      type: 'boolean'
    }
  },
  required: ['id', 'name'],
  indexes: ['name', 'createdAt']
};

export type ManufacturerCollection = RxCollection<Manufacturer>;

// Implementación para RxDB local
export class LocalManufacturerDB {
  private collection?: ManufacturerCollection;

  async init(db: RxDatabase): Promise<void> {
    this.collection = await db.addCollections({
      manufacturers: {
        schema: manufacturerSchema
      }
    }).then(collections => collections.manufacturers);
  }

  async create(data: Omit<Manufacturer, 'id'> & { id: string }): Promise<Manufacturer> {
    if (!this.collection) throw new Error('Manufacturer collection not initialized');
    
    const doc = await this.collection.insert(data);
    return JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer;
  }

  async findById(id: string): Promise<Manufacturer | null> {
    if (!this.collection) throw new Error('Manufacturer collection not initialized');
    
    const doc = await this.collection.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer : null;
  }

  async findAll(): Promise<Manufacturer[]> {
    if (!this.collection) throw new Error('Manufacturer collection not initialized');
    
    const docs = await this.collection.find({
      selector: { deleted: { $ne: true } }
    }).exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer);
  }

  async findByName(name: string): Promise<Manufacturer | null> {
    if (!this.collection) throw new Error('Manufacturer collection not initialized');
    
    const doc = await this.collection.findOne({
      selector: { 
        name: { $eq: name },
        deleted: { $ne: true }
      }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer : null;
  }

  async update(id: string, data: Partial<Manufacturer>): Promise<Manufacturer> {
    if (!this.collection) throw new Error('Manufacturer collection not initialized');
    
    const doc = await this.collection.findOne(id).exec();
    if (!doc) throw new Error('Manufacturer not found');
    
    await doc.update({
      $set: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.collection) throw new Error('Manufacturer collection not initialized');
    
    const doc = await this.collection.findOne(id).exec();
    if (!doc) return false;
    
    // Soft delete
    await doc.update({
      $set: {
        deleted: true,
        updatedAt: new Date().toISOString()
      }
    });
    return true;
  }

  async search(query: string): Promise<Manufacturer[]> {
    if (!this.collection) throw new Error('Manufacturer collection not initialized');
    
    const docs = await this.collection.find({
      selector: {
        $and: [
          { deleted: { $ne: true } },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { country: { $regex: query, $options: 'i' } },
              { contactEmail: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      }
    }).exec();
    
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer);
  }
}

// Implementación para Firestore (placeholder)
export class FirestoreManufacturerDB {
  async create(_data: Omit<Manufacturer, 'id'> & { id: string }): Promise<Manufacturer> {
    throw new Error('Firestore implementation not yet available');
  }

  async findById(_id: string): Promise<Manufacturer | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findAll(): Promise<Manufacturer[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByName(_name: string): Promise<Manufacturer | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async update(_id: string, _data: Partial<Manufacturer>): Promise<Manufacturer> {
    throw new Error('Firestore implementation not yet available');
  }

  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }

  async search(_query: string): Promise<Manufacturer[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

// Selector de base de datos según el modo
const getManufacturerDB = () => {
  return config.APP_MODE === 'local' ? localManufacturerDB : firestoreManufacturerDB;
};

// Instancias
export const localManufacturerDB = new LocalManufacturerDB();
export const firestoreManufacturerDB = new FirestoreManufacturerDB();
export { getManufacturerDB };
