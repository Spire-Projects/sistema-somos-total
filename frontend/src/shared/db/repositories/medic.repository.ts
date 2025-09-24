import type { RxCollection } from 'rxdb';
import type { Medic } from '@/shared/types/Sales';
import type { ItemsResponse } from '@/shared/types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { generateId } from '@/shared/utils/id.utils';

// Tipos para el repositorio
export interface CreateMedicData {
  fullName: string;
  specialty?: string;
  licenseNumber: string;
  createdBy: string;
}

export interface UpdateMedicData {
  fullName?: string;
  specialty?: string;
  licenseNumber?: string;
  updatedBy: string;
}

export interface MedicFilters {
  searchQuery?: string;
  isDeleted?: boolean;
}

export interface IMedicRepository {
  // CRUD básico
  create(data: CreateMedicData): Promise<Medic>;
  findById(id: string): Promise<Medic | null>;
  update(id: string, data: UpdateMedicData): Promise<Medic>;
  delete(id: string): Promise<void>;
  
  // Búsquedas y listados
  findAll(): Promise<Medic[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Medic>>;
  
  // Búsquedas especializadas
  searchByNameOrLicense(searchQuery: string): Promise<Medic[]>;
  searchByNameOrLicensePaginated(searchQuery: string, page: number, size: number): Promise<ItemsResponse<Medic>>;
  
  // Validaciones
  licenseNumberExists(licenseNumber: string, excludeId?: string): Promise<boolean>;
  fullNameExists(fullName: string, excludeId?: string): Promise<boolean>;
}

/**
 * Repositorio local para Medic usando RxDB
 */
export class LocalMedicRepository implements IMedicRepository {
  private async getCollection(): Promise<RxCollection<Medic>> {
    const db = await initDatabase();
    return db.medics;
  }

  async create(data: CreateMedicData): Promise<Medic> {
    const collection = await this.getCollection();
    
    const medic: Medic = {
      id: generateId(),
      fullName: data.fullName,
      licenseNumber: data.licenseNumber,
      specialty: data.specialty ?? 'General',
      isDeleted: false,
      sincronized: false,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy,
    };

    const doc = await collection.insert(medic);
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medic;
  }

  async findById(id: string): Promise<Medic | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({
      selector: {
        id,
        isDeleted: { $ne: true }
      }
    }).exec();
    
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medic : null;
  }

  async update(id: string, data: UpdateMedicData): Promise<Medic> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({
      selector: {
        id,
        isDeleted: { $ne: true }
      }
    }).exec();

    if (!doc) {
      throw new Error(`Medic with ID "${id}" not found`);
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await doc.update({
      $set: updateData
    });

    return JSON.parse(JSON.stringify(doc.toJSON())) as Medic;
  }

  async delete(id: string): Promise<void> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({
      selector: {
        id,
        isDeleted: { $ne: true }
      }
    }).exec();

    if (!doc) {
      throw new Error(`Medic with ID "${id}" not found`);
    }

    await doc.update({
      $set: {
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      }
    });
  }

  async findAll(): Promise<Medic[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: {
        isDeleted: { $ne: true }
      },
      sort: [{ fullName: 'asc' }]
    }).exec();

    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Medic);
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Medic>> {
    const collection = await this.getCollection();

    let selector: any = {
      isDeleted: { $ne: true }
    };

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim();
      selector = {
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [
              { fullName: { $regex: q, $options: 'i' } },
              { licenseNumber: { $regex: q, $options: 'i' } }
            ]
          }
        ]
      };
    }

    const query = collection.find({
      selector,
      sort: [{ fullName: 'asc' }]
    });

    const all = await query.exec();
    const totalItems = all.length;
    const totalPages = Math.ceil(totalItems / size);
    const offset = (page - 1) * size;
    const paginated = all.slice(offset, offset + size).map(doc => 
      JSON.parse(JSON.stringify(doc.toJSON())) as Medic
    );

    return {
      items: paginated,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async searchByNameOrLicense(searchQuery: string): Promise<Medic[]> {
    if (!searchQuery || searchQuery.trim() === '') {
      return this.findAll();
    }

    const collection = await this.getCollection();
    const q = searchQuery.trim();
    
    const docs = await collection.find({
      selector: {
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [
              { fullName: { $regex: q, $options: 'i' } },
              { licenseNumber: { $regex: q, $options: 'i' } }
            ]
          }
        ]
      },
      sort: [{ fullName: 'asc' }]
    }).exec();

    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Medic);
  }

  async searchByNameOrLicensePaginated(searchQuery: string, page: number, size: number): Promise<ItemsResponse<Medic>> {
    return this.findAllPaginated(page, size, searchQuery);
  }

  async licenseNumberExists(licenseNumber: string, excludeId?: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    let selector: any = {
      licenseNumber,
      isDeleted: { $ne: true }
    };

    if (excludeId) {
      selector.id = { $ne: excludeId };
    }

    const doc = await collection.findOne({
      selector
    }).exec();

    return !!doc;
  }

  async fullNameExists(fullName: string, excludeId?: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    let selector: any = {
      fullName,
      isDeleted: { $ne: true }
    };

    if (excludeId) {
      selector.id = { $ne: excludeId };
    }

    const doc = await collection.findOne({
      selector
    }).exec();

    return !!doc;
  }
}

/**
 * Repositorio para Firestore (placeholder)
 */
export class FirestoreMedicRepository implements IMedicRepository {
  async create(_data: CreateMedicData): Promise<Medic> {
    throw new Error('Firestore implementation not yet available');
  }

  async findById(_id: string): Promise<Medic | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async update(_id: string, _data: UpdateMedicData): Promise<Medic> {
    throw new Error('Firestore implementation not yet available');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Firestore implementation not yet available');
  }

  async findAll(): Promise<Medic[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<Medic>> {
    throw new Error('Firestore implementation not yet available');
  }

  async searchByNameOrLicense(_searchQuery: string): Promise<Medic[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async searchByNameOrLicensePaginated(_searchQuery: string, _page: number, _size: number): Promise<ItemsResponse<Medic>> {
    throw new Error('Firestore implementation not yet available');
  }

  async licenseNumberExists(_licenseNumber: string, _excludeId?: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }

  async fullNameExists(_fullName: string, _excludeId?: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const LocalMedicDb = new LocalMedicRepository();
export const FirestoreMedicDb = new FirestoreMedicRepository();

export const getMedicRepository = (): IMedicRepository => {
  return config.APP_MODE === 'local' ? LocalMedicDb : FirestoreMedicDb;
};
