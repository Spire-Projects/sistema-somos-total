import type { RxCollection } from 'rxdb';
import { Observable, map } from 'rxjs';
import { initDatabase } from '../database';
import type { CreateProductData, Product, ProductFilter, UpdateProductData } from '../../types/modelTypes/Product';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import type { ICrudBaseRepository } from './interfaces/IRepository';
import { config } from '../../config/config';

export interface IProductRepository extends ICrudBaseRepository<Product, CreateProductData, UpdateProductData, ProductFilter> {
  
}

export class LocalProductRepository extends BaseRepository<Product> implements IProductRepository {
  
  protected async getCollection(): Promise<RxCollection<Product>> {
    const db = await initDatabase();
    return db.products;
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<Product> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Verificar si ya existe un producto con el mismo código
    const collection = await this.getCollection();
    const existing = await collection.findOne({
      selector: { code: data.code }
    }).exec();
    
    if (existing) {
      throw new Error(`Ya existe un producto con el código: ${data.code}`);
    }
    
    const fullData: Product = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false
    } as Product;
    
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<Product>): Promise<Product | null> {
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar producto ${id}:`, error);
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
    dateTo?: string,
    filter?: ProductFilter
  ): Promise<ItemsResponse<Product>> {
    const collection = await this.getCollection();
    
    const selector: any = { isDeleted: false };
    
    // Filtro de búsqueda
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      selector.$or = [
        { code: { $regex: normalizedText, $options: 'i' } },
        { name: { $regex: normalizedText, $options: 'i' } },
        { category: { $regex: normalizedText, $options: 'i' } },
        { description: { $regex: normalizedText, $options: 'i' } }
      ];
    }

    // Filtro por categoría
    if (filter?.category) {
      selector.category = filter.category;
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
      sort: [{ isDeleted: 'asc', createdAt: 'desc' }],
      skip,
      limit
    }).exec();

    const items = docs.slice(0, size).map(doc => 
      JSON.parse(JSON.stringify(doc.toJSON())) as Product
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

  async findById(id: string): Promise<Product | null> {
    return await super.findById(id);
  }

  listen$(
    page: number, 
    size: number, 
    searchQuery?: string, 
    dateFrom?: string, 
    dateTo?: string,
    filter?: ProductFilter
  ): Observable<Product[]> {
    return new Observable<Product[]>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          const selector: any = { isDeleted: false };
          
          // Filtro de búsqueda
          if (searchQuery && searchQuery.trim() !== "") {
            const normalizedText = searchQuery.trim().toLowerCase();
            selector.$or = [
              { code: { $regex: normalizedText, $options: 'i' } },
              { name: { $regex: normalizedText, $options: 'i' } },
              { category: { $regex: normalizedText, $options: 'i' } },
              { description: { $regex: normalizedText, $options: 'i' } }
            ];
          }

          // Filtro por categoría
          if (filter?.category) {
            selector.category = filter.category;
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
            sort: [{ isDeleted: 'asc', createdAt: 'desc' }],
            skip,
            limit: size
          }).$.pipe(
            map(docs => docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Product))
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

  lisntenById$(id: string): Observable<Product | null> {
    return new Observable<Product | null>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          subscription = collection.findOne(id).$.pipe(
            map(doc => doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Product : null)
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

export class FirestoreProductRepository implements IProductRepository {
  create(_data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<Product> {
    throw new Error('Firestore implementation not yet available');
  }
  update(_id: string, _updateData: Partial<Product>): Promise<Product | null> {
    throw new Error('Firestore implementation not yet available');
  }
  softDelete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  getAll(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string, _filter?: ProductFilter): Promise<ItemsResponse<Product>> {
    throw new Error('Firestore implementation not yet available');
  }
  findById(_id: string): Promise<Product | null> {
    throw new Error('Firestore implementation not yet available');
  }
  listen$(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string, _filter?: ProductFilter): Observable<Product[]> {
    throw new Error('Firestore implementation not yet available');
  }
  lisntenById$(_id: string): Observable<Product | null> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localProductRepository = new LocalProductRepository();
export const firestoreProductRepository = new FirestoreProductRepository();

export const getProductRepository = (): IProductRepository => {
  return config.APP_MODE === 'local' ? localProductRepository : firestoreProductRepository;
};
