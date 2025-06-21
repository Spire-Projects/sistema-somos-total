import type { RxJsonSchema, RxDatabase, RxCollection } from 'rxdb';
import type { Medication, MedicationBatch } from '../../types/Medication';
import { config } from '../../config/config';

// Esquema para MedicationBatch
const medicationBatchSchema = {
  type: 'object',
  properties: {
    batchId: { type: 'string', maxLength: 100 },
    expirationDate: { type: 'string', maxLength: 50 },
    quantity: { type: 'number' },
    purchasePrice: { type: 'number' },
    sellingPrice: { type: 'number' },
    purchaseDate: { type: 'string', maxLength: 50 },
    supplier: { type: 'string', maxLength: 200 },
    createdAt: { type: 'string', maxLength: 50 },
    createdBy: { type: 'string', maxLength: 100 }
  },
  required: ['batchId', 'expirationDate', 'quantity', 'purchasePrice', 'sellingPrice']
};

// Esquema RxDB para Medication
export const medicationSchema: RxJsonSchema<Medication> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    tradeName: {
      type: 'string',
      maxLength: 300
    },
    genericName: {
      type: 'string',
      maxLength: 300
    },
    activeIngredientIds: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 100
      }
    },
    pharmaceuticalFormId: {
      type: 'string',
      maxLength: 100
    },
    concentration: {
      type: 'string',
      maxLength: 100
    },
    presentation: {
      type: 'string',
      maxLength: 200
    },
    manufacturerId: {
      type: 'string',
      maxLength: 100
    },
    categoryId: {
      type: 'string',
      maxLength: 100
    },
    barcode: {
      type: 'string',
      maxLength: 50
    },
    batches: {
      type: 'array',
      items: medicationBatchSchema
    },
    totalStock: {
      type: 'number'
    },
    description: {
      type: 'string',
      maxLength: 1000
    },
    indications: {
      type: 'string',
      maxLength: 1000
    },
    warnings: {
      type: 'string',
      maxLength: 1000
    },
    sincronized: {
      type: 'boolean'
    },
    isDeleted: {
      type: 'boolean'
    },
    createdAt: {
      type: 'string',
      maxLength: 50
    },
    createdBy: {
      type: 'string',
      maxLength: 100
    },
    updatedAt: {
      type: 'string',
      maxLength: 50
    },
    updatedBy: {
      type: 'string',
      maxLength: 100
    }
  },
  required: ['id', 'tradeName', 'genericName', 'activeIngredientIds', 'pharmaceuticalFormId', 'concentration', 'presentation', 'manufacturerId', 'categoryId', 'batches', 'totalStock'],
  indexes: ['tradeName', 'genericName', 'barcode', 'categoryId', 'manufacturerId', 'createdAt']
};

export type MedicationCollection = RxCollection<Medication>;

// Implementación para RxDB local
export class LocalMedicationDB {
  private collection?: MedicationCollection;

  async init(db: RxDatabase): Promise<void> {
    // La colección ya fue creada en initDatabase, solo obtenemos la referencia
    this.collection = db.collections.medications as MedicationCollection;
  }

  async create(data: Omit<Medication, 'id'> & { id: string }): Promise<Medication> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const doc = await this.collection.insert(data);
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medication;
  }

  async findById(id: string): Promise<Medication | null> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const doc = await this.collection.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findAll(): Promise<Medication[]> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const docs = await this.collection.find({
      selector: { isDeleted: { $ne: true } }
    }).exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async findByTradeName(tradeName: string): Promise<Medication | null> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const doc = await this.collection.findOne({
      selector: { 
        tradeName: { $eq: tradeName },
        isDeleted: { $ne: true }
      }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findByBarcode(barcode: string): Promise<Medication | null> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const doc = await this.collection.findOne({
      selector: { 
        barcode: { $eq: barcode },
        isDeleted: { $ne: true }
      }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findByCategory(categoryId: string): Promise<Medication[]> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const docs = await this.collection.find({
      selector: { 
        categoryId: { $eq: categoryId },
        isDeleted: { $ne: true }
      }
    }).exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async findByManufacturer(manufacturerId: string): Promise<Medication[]> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const docs = await this.collection.find({
      selector: { 
        manufacturerId: { $eq: manufacturerId },
        isDeleted: { $ne: true }
      }
    }).exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async update(id: string, data: Partial<Medication>): Promise<Medication> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const doc = await this.collection.findOne(id).exec();
    if (!doc) throw new Error('Medication not found');
    
    await doc.update({
      $set: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medication;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
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

  async search(query: string): Promise<Medication[]> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const docs = await this.collection.find({
      selector: {
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [
              { tradeName: { $regex: query, $options: 'i' } },
              { genericName: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { barcode: { $eq: query } }
            ]
          }
        ]
      }
    }).exec();
    
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async addBatch(medicationId: string, batch: MedicationBatch): Promise<Medication> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const doc = await this.collection.findOne(medicationId).exec();
    if (!doc) throw new Error('Medication not found');
    
    const medication = doc.toJSON() as Medication;
    
    // Verificar que no exista un lote con el mismo batchId
    const existingBatch = medication.batches.find(b => b.batchId === batch.batchId);
    if (existingBatch) {
      throw new Error(`Batch with ID "${batch.batchId}" already exists for this medication`);
    }
    
    const updatedBatches = [...medication.batches, batch];
    const newTotalStock = updatedBatches.reduce((total, b) => total + b.quantity, 0);
    
    await doc.update({
      $set: {
        batches: updatedBatches,
        totalStock: newTotalStock,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medication;
  }

  async updateBatch(medicationId: string, batchId: string, batchData: Partial<MedicationBatch>): Promise<Medication> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const doc = await this.collection.findOne(medicationId).exec();
    if (!doc) throw new Error('Medication not found');
    
    const medication = doc.toJSON() as Medication;
    const batchIndex = medication.batches.findIndex(b => b.batchId === batchId);
    
    if (batchIndex === -1) {
      throw new Error(`Batch with ID "${batchId}" not found`);
    }
    
    const updatedBatches = [...medication.batches];
    updatedBatches[batchIndex] = { ...updatedBatches[batchIndex], ...batchData };
    
    const newTotalStock = updatedBatches.reduce((total, b) => total + b.quantity, 0);
    
    await doc.update({
      $set: {
        batches: updatedBatches,
        totalStock: newTotalStock,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medication;
  }

  async removeBatch(medicationId: string, batchId: string): Promise<Medication> {
    if (!this.collection) throw new Error('Medication collection not initialized');
    
    const doc = await this.collection.findOne(medicationId).exec();
    if (!doc) throw new Error('Medication not found');
    
    const medication = doc.toJSON() as Medication;
    const updatedBatches = medication.batches.filter(b => b.batchId !== batchId);
    
    if (updatedBatches.length === medication.batches.length) {
      throw new Error(`Batch with ID "${batchId}" not found`);
    }
    
    const newTotalStock = updatedBatches.reduce((total, b) => total + b.quantity, 0);
    
    await doc.update({
      $set: {
        batches: updatedBatches,
        totalStock: newTotalStock,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medication;
  }
}

// Implementación para Firestore (placeholder)
export class FirestoreMedicationDB {
  async create(_data: Omit<Medication, 'id'> & { id: string }): Promise<Medication> {
    throw new Error('Firestore implementation not yet available');
  }

  async findById(_id: string): Promise<Medication | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findAll(): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByTradeName(_tradeName: string): Promise<Medication | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByBarcode(_barcode: string): Promise<Medication | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByCategory(_categoryId: string): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByManufacturer(_manufacturerId: string): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async update(_id: string, _data: Partial<Medication>): Promise<Medication> {
    throw new Error('Firestore implementation not yet available');
  }

  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }

  async search(_query: string): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async addBatch(_medicationId: string, _batch: MedicationBatch): Promise<Medication> {
    throw new Error('Firestore implementation not yet available');
  }

  async updateBatch(_medicationId: string, _batchId: string, _batchData: Partial<MedicationBatch>): Promise<Medication> {
    throw new Error('Firestore implementation not yet available');
  }

  async removeBatch(_medicationId: string, _batchId: string): Promise<Medication> {
    throw new Error('Firestore implementation not yet available');
  }
}

// Selector de base de datos según el modo
const getMedicationDB = () => {
  return config.APP_MODE === 'local' ? localMedicationDB : firestoreMedicationDB;
};

// Instancias
export const localMedicationDB = new LocalMedicationDB();
export const firestoreMedicationDB = new FirestoreMedicationDB();
export { getMedicationDB };
