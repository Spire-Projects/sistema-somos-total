import type { ItemsResponse } from '@/shared/types/UtilTypes';
import type { Medication } from '../../types/Medication';
import type { RxCollection } from 'rxdb';
import { config } from '@/shared/config/config';

export interface IMedicationRepository {
  create(data: Omit<Medication, 'id'> & { id: string }): Promise<Medication>;
  findById(id: string): Promise<Medication | null>;
  findAll(): Promise<Medication[]>;
  find(page: number, size: number) : Promise<ItemsResponse <Medication>>;
  findByTradeName(tradeName: string): Promise<Medication | null>;
  findByBarcode(barcode: string): Promise<Medication | null>;
  findByCategory(categoryId: string): Promise<Medication[]>;
  findByManufacturer(manufacturerId: string): Promise<Medication[]>;
  update(id: string, data: Partial<Medication>): Promise<Medication>;
  delete(id: string): Promise<boolean>;
  search(query: string): Promise<Medication[]>;
}

export type MedicationCollection = RxCollection<Medication>;

export class LocalMedicationDB implements IMedicationRepository {
  private async getCollection(): Promise<MedicationCollection> {
    const { getDatabase } = await import('../database');
    const db = getDatabase();
    if (!db) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db.medications;
  }

  async find(page: number, size: number): Promise<ItemsResponse<Medication>> {
    const collection = await this.getCollection();
    const skip = (page - 1) * size;

    // Buscar todos los medicamentos no eliminados y ordenados por tradeName ascendente
    const allDocs = await collection.find({
      selector: { isDeleted: { $ne: true } },
      sort: [{ tradeName: 'asc' }]
    }).exec();

    const totalItems = allDocs.length;
    const totalPages = Math.ceil(totalItems / size);

    const items = allDocs
      .slice(skip, skip + size)
      .map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);

    return {
      items,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async create(data: Omit<Medication, 'id'> & { id: string }): Promise<Medication> {
    const collection = await this.getCollection();
    const doc = await collection.insert(data);
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medication;
  }

  async findById(id: string): Promise<Medication | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findAll(): Promise<Medication[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: { isDeleted: { $ne: true } }
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async findByTradeName(tradeName: string): Promise<Medication | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({
      selector: { 
        tradeName: { $eq: tradeName },
        isDeleted: { $ne: true }
      }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findByBarcode(barcode: string): Promise<Medication | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({
      selector: { 
        barcode: { $eq: barcode },
        isDeleted: { $ne: true }
      }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findByCategory(categoryId: string): Promise<Medication[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: { 
        categoryId: { $eq: categoryId },
        isDeleted: { $ne: true }
      }
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async findByManufacturer(manufacturerId: string): Promise<Medication[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: { 
        manufacturerId: { $eq: manufacturerId },
        isDeleted: { $ne: true }
      }
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async update(id: string, data: Partial<Medication>): Promise<Medication> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
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
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
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
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: {
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [
            {comercialName: { $regex: query, $options: 'i' } },
              { tradeName: { $regex: query, $options: 'i' } },
              { genericName: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { barcode: { $eq: query } }
            ]
          }
        ]
      }
    }).exec();
    
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }
}


export class FirestoreMedicationDB implements IMedicationRepository {
  async find(_page: number, _size: number): Promise<ItemsResponse<Medication>> {
    throw new Error('Firestore implementation not yet available');
  }

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
}

export const LocalMedicationDb = new LocalMedicationDB();
export const FirestoreMedicationDb = new FirestoreMedicationDB();

export const getMedicationRepository = (): IMedicationRepository => {
  return config.APP_MODE === 'local' ? LocalMedicationDb : FirestoreMedicationDb;
};