import type { NIT } from '../../types/Nit';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';

export interface INitRepository {
  create(nitData: Omit<NIT, 'id'>): Promise<NIT>;
  findById(id: string): Promise<NIT | null>;
  findByNumberNit(numberNit: string): Promise<NIT | null>;
  findBySocialReason(socialReason: string): Promise<NIT | null>;
  findAll(): Promise<NIT[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<NIT>>;
  searchByText(searchQuery: string, page?: number, size?: number): Promise<ItemsResponse<NIT>>; // Nueva función de búsqueda
  update(id: string, updateData: Partial<NIT>): Promise<NIT | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  getActiveNits(): Promise<NIT[]>;
  getDeletedNits(): Promise<NIT[]>;
}

export class LocalNitRepository extends BaseRepository<NIT> implements INitRepository {
  
  protected async getCollection(): Promise<RxCollection<NIT>> {
    const db = await initDatabase();
    return db.nits;
  }

  async create(nitData: Omit<NIT, 'id'>): Promise<NIT> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullNitData = { 
      id, 
      ...nitData,
      createdAt: now,
      updatedAt: now,
      sincronized: false,
      isDeleted: false
    };
    
    console.log(`🔄 NitRepository: Creando NIT con prioridad`, { id });
    return await this.createWithPriority(fullNitData as NIT);
  }

  async update(id: string, updateData: Partial<NIT>): Promise<NIT | null> {
    console.log(`🔄 NitRepository: Actualizando NIT ${id} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar NIT ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ NitRepository: Eliminando NIT ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<NIT | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<NIT[]> {
    return await super.findAll();
  }

  async findByNumberNit(numberNit: string): Promise<NIT | null> {
    const db = await initDatabase();
    const nit = await db.nits.findOne({ 
      selector: { 
        isDeleted: false,
        numberNit
      },
      sort: [{ isDeleted: 'asc', numberNit: 'asc' }]
    }).exec();
    return nit ? JSON.parse(JSON.stringify(nit.toJSON())) as NIT : null;
  }

  async findBySocialReason(socialReason: string): Promise<NIT | null> {
    const db = await initDatabase();
    const nit = await db.nits.findOne({ 
      selector: { 
        isDeleted: false,
        socialReason
      },
      sort: [{ isDeleted: 'asc', socialReason: 'asc' }]
    }).exec();
    return nit ? JSON.parse(JSON.stringify(nit.toJSON())) as NIT : null;
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<NIT>> {
    const db = await initDatabase();
    
    const selector = { isDeleted: false };
    
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      Object.assign(selector, {
        $or: [
          { numberNit: { $regex: normalizedText, $options: 'i' } },
          { socialReason: { $regex: normalizedText, $options: 'i' } }
        ]
      });
    }

    // Estrategia optimizada: obtener solo los datos necesarios para paginación
    const skip = (page - 1) * size;
    const limit = size + 1; // +1 para saber si hay más páginas
    
    const nits = await db.nits.find({
      selector,
      sort: [{ isDeleted: 'asc', createdAt: 'desc' }],
      skip,
      limit
    }).exec();

    const items = nits.slice(0, size).map((nit) => 
      JSON.parse(JSON.stringify(nit.toJSON())) as NIT
    );
    
    const hasMore = nits.length > size;
    
    // Estimación inteligente del total sin usar count()
    let totalItems: number;
    let totalPages: number;
    
    if (page === 1 && !hasMore) {
      // Primera página y no hay más: el total es exacto
      totalItems = items.length;
      totalPages = 1;
    } else if (page === 1 && hasMore) {
      // Primera página con más datos: estimamos basado en el patrón
      totalItems = Math.max(size * 3, skip + size + 10); // Estimación conservadora
      totalPages = Math.ceil(totalItems / size);
    } else {
      // Páginas posteriores: estimamos basado en la posición actual
      totalItems = hasMore ? skip + size + 10 : skip + items.length;
      totalPages = Math.ceil(totalItems / size);
    }

    return {
      items,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async searchByText(searchQuery: string, page: number = 1, size: number = 10): Promise<ItemsResponse<NIT>> {
    return await this.findAllPaginated(page, size, searchQuery);
  }

  async getActiveNits(): Promise<NIT[]> {
    const db = await initDatabase();
    const nits = await db.nits.find({
      selector: {
        isDeleted: false
      },
      sort: [{ isDeleted: 'asc', socialReason: 'asc' }]
    }).exec();
    return nits.map((nit) => JSON.parse(JSON.stringify(nit.toJSON())) as NIT);
  }

  async getDeletedNits(): Promise<NIT[]> {
    const db = await initDatabase();
    const nits = await db.nits.find({
      selector: {
        isDeleted: true
      },
      sort: [{ isDeleted: 'asc', updatedAt: 'desc' }]
    }).exec();
    return nits.map((nit) => JSON.parse(JSON.stringify(nit.toJSON())) as NIT);
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const db = await initDatabase();
    const nit = await db.nits.findOne(id).exec();
    if (!nit) return false;
    
    await nit.update({ 
      $set: { 
        isDeleted: true, 
        updatedBy: deletedBy,
        updatedAt: new Date().toISOString() 
      } 
    });
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const db = await initDatabase();
    const nit = await db.nits.findOne(id).exec();
    if (!nit) return false;
    
    await nit.update({ 
      $set: { 
        isDeleted: false,
        updatedAt: new Date().toISOString() 
      } 
    });
    return true;
  }
}

export class FirestoreNitRepository implements INitRepository {
  async create(_nitData: Omit<NIT, 'id'>): Promise<NIT> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<NIT | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByNumberNit(_numberNit: string): Promise<NIT | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findBySocialReason(_socialReason: string): Promise<NIT | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<NIT[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<NIT>> {
    throw new Error('Firestore implementation not yet available');
  }
  async searchByText(_searchQuery: string, _page?: number, _size?: number): Promise<ItemsResponse<NIT>> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<NIT>): Promise<NIT | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async softDelete(_id: string, _deletedBy: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async restore(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async getActiveNits(): Promise<NIT[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async getDeletedNits(): Promise<NIT[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localNitRepository = new LocalNitRepository();
export const firestoreNitRepository = new FirestoreNitRepository();

export const getNitRepository = (): INitRepository => {
  return config.APP_MODE === 'local' ? localNitRepository : firestoreNitRepository;
};
