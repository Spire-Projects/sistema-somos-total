import type { RxCollection } from 'rxdb';
import { Observable, map } from 'rxjs';
import { initDatabase } from '../database';
import type { Category, CreateCategoryData, UpdateCategoryData } from '../../types/modelTypes/Category';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import type { ICrudBaseRepository } from './interfaces/IRepository';
import { config } from '../../config/config';

export interface CategoryFilter {
  // Filtros futuros si se necesitan
}

export interface ICategoryRepository extends ICrudBaseRepository<Category, CreateCategoryData, UpdateCategoryData, CategoryFilter> {
  
}

export class LocalCategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
  
  protected async getCollection(): Promise<RxCollection<Category>> {
    const db = await initDatabase();
    return db.categories;
  }

  async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<Category> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullData: Category = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false
    } as Category;
    
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<Category>): Promise<Category | null> {
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar categoría ${id}:`, error);
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
  ): Promise<ItemsResponse<Category>> {
    const collection = await this.getCollection();
    
    const selector: any = { isDeleted: false };
    
    // Filtro de búsqueda
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      selector.$or = [
        { name: { $regex: normalizedText, $options: 'i' } },
        { description: { $regex: normalizedText, $options: 'i' } }
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
      JSON.parse(JSON.stringify(doc.toJSON())) as Category
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

  async findById(id: string): Promise<Category | null> {
    return await super.findById(id);
  }

  listen$(
    page: number, 
    size: number, 
    searchQuery?: string, 
    dateFrom?: string, 
    dateTo?: string
  ): Observable<Category[]> {
    return new Observable<Category[]>(subscriber => {
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
              { description: { $regex: normalizedText, $options: 'i' } }
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
            map(docs => docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Category))
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

  lisntenById$(id: string): Observable<Category | null> {
    return new Observable<Category | null>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          subscription = collection.findOne(id).$.pipe(
            map(doc => doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Category : null)
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

export class FirestoreCategoryRepository implements ICategoryRepository {
  create(_data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<Category> {
    throw new Error('Firestore implementation not yet available');
  }
  update(_id: string, _updateData: Partial<Category>): Promise<Category | null> {
    throw new Error('Firestore implementation not yet available');
  }
  softDelete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  getAll(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string): Promise<ItemsResponse<Category>> {
    throw new Error('Firestore implementation not yet available');
  }
  findById(_id: string): Promise<Category | null> {
    throw new Error('Firestore implementation not yet available');
  }
  listen$(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string): Observable<Category[]> {
    throw new Error('Firestore implementation not yet available');
  }
  lisntenById$(_id: string): Observable<Category | null> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localCategoryRepository = new LocalCategoryRepository();
export const firestoreCategoryRepository = new FirestoreCategoryRepository();

export const getCategoryRepository = (): ICategoryRepository => {
  return config.APP_MODE === 'local' ? localCategoryRepository : firestoreCategoryRepository;
};
