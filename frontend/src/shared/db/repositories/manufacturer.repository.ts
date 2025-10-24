import type { RxCollection } from 'rxdb';
import { Observable, map } from 'rxjs';
import { initDatabase } from '../database';
import type { Manufacturer, CreateManufacturerData, UpdateManufacturerData, ManufacturerFilter } from '../../types/modelTypes/Manufacturer';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import type { ICrudBaseRepository } from './interfaces/IRepository';
import { config } from '../../config/config';

export interface IManufacturerRepository extends ICrudBaseRepository<Manufacturer, CreateManufacturerData, UpdateManufacturerData, ManufacturerFilter> {
  
}

export class LocalManufacturerRepository extends BaseRepository<Manufacturer> implements IManufacturerRepository {
  
  protected async getCollection(): Promise<RxCollection<Manufacturer>> {
    const db = await initDatabase();
    return db.manufacturers;
  }

  async create(data: Omit<Manufacturer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<Manufacturer> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullData: Manufacturer = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false
    } as Manufacturer;
    
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<Manufacturer>): Promise<Manufacturer | null> {
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar fabricante ${id}:`, error);
      return null;
    }
  }

  async softDelete(id: string): Promise<boolean> {
    return await this.deleteWithPriority(id);
  }

  async getAll(
    page: number, 
    size: number, 
    searchQuery?: string, 
    dateFrom?: string, 
    dateTo?: string
  ): Promise<ItemsResponse<Manufacturer>> {
    const collection = await this.getCollection();
    
    const selector: any = { isDeleted: false };
    
    // Filtro de búsqueda
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      selector.$or = [
        { name: { $regex: normalizedText, $options: 'i' } },
        { country: { $regex: normalizedText, $options: 'i' } },
        { contactEmail: { $regex: normalizedText, $options: 'i' } }
      ];
    }

    // Filtro de fechas
    if (dateFrom || dateTo) {
      selector.createdAt = {};
      if (dateFrom) selector.createdAt.$gte = dateFrom;
      if (dateTo) selector.createdAt.$lte = dateTo;
    }

    const skip = (page - 1) * size;
    const limit = size + 1;
    
    const docs = await collection.find({
      selector,
      sort: [{ isDeleted: 'asc', name: 'asc' }],
      skip,
      limit
    }).exec();

    const items = docs.slice(0, size).map(doc => 
      JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer
    );
    
    const hasMore = docs.length > size;
    
    // Estimación del total
    let totalItems: number;
    let totalPages: number;
    
    if (page === 1 && !hasMore) {
      totalItems = items.length;
      totalPages = 1;
    } else if (page === 1 && hasMore) {
      totalItems = size * 2;
      totalPages = 2;
    } else {
      totalItems = (page - 1) * size + items.length + (hasMore ? size : 0);
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

  async findById(id: string): Promise<Manufacturer | null> {
    return await super.findById(id);
  }

  listen$(
    page: number, 
    size: number, 
    searchQuery?: string, 
    dateFrom?: string, 
    dateTo?: string
  ): Observable<Manufacturer[]> {
    return new Observable<Manufacturer[]>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          const selector: any = { isDeleted: false };
          
          // Filtro de búsqueda
          if (searchQuery && searchQuery.trim() !== "") {
            const normalizedText = searchQuery.trim().toLowerCase();
            selector.$or = [
              { name: { $regex: normalizedText, $options: 'i' } },
              { country: { $regex: normalizedText, $options: 'i' } },
              { contactEmail: { $regex: normalizedText, $options: 'i' } }
            ];
          }

          // Filtro de fechas
          if (dateFrom || dateTo) {
            selector.createdAt = {};
            if (dateFrom) selector.createdAt.$gte = dateFrom;
            if (dateTo) selector.createdAt.$lte = dateTo;
          }

          const skip = (page - 1) * size;
          
          subscription = collection.find({
            selector,
            sort: [{ isDeleted: 'asc', name: 'asc' }],
            skip,
            limit: size
          }).$.pipe(
            map(docs => docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer))
          ).subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => subscriber.error(err)
          });
        } catch (error) {
          subscriber.error(error);
        }
      })();
      
      return () => {
        if (subscription) subscription.unsubscribe();
      };
    });
  }

  lisntenById$(id: string): Observable<Manufacturer | null> {
    return new Observable<Manufacturer | null>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          subscription = collection.findOne(id).$.pipe(
            map(doc => doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Manufacturer : null)
          ).subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => subscriber.error(err)
          });
        } catch (error) {
          subscriber.error(error);
        }
      })();
      
      return () => {
        if (subscription) subscription.unsubscribe();
      };
    });
  }
}

export class FirestoreManufacturerRepository implements IManufacturerRepository {
  create(_data: Omit<Manufacturer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<Manufacturer> {
    throw new Error('Firestore implementation not yet available');
  }
  update(_id: string, _updateData: Partial<Manufacturer>): Promise<Manufacturer | null> {
    throw new Error('Firestore implementation not yet available');
  }
  softDelete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  getAll(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string): Promise<ItemsResponse<Manufacturer>> {
    throw new Error('Firestore implementation not yet available');
  }
  findById(_id: string): Promise<Manufacturer | null> {
    throw new Error('Firestore implementation not yet available');
  }
  listen$(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string): Observable<Manufacturer[]> {
    throw new Error('Firestore implementation not yet available');
  }
  lisntenById$(_id: string): Observable<Manufacturer | null> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localManufacturerRepository = new LocalManufacturerRepository();
export const firestoreManufacturerRepository = new FirestoreManufacturerRepository();

export const getManufacturerRepository = (): IManufacturerRepository => {
  return config.APP_MODE === 'local' ? localManufacturerRepository : firestoreManufacturerRepository;
};
