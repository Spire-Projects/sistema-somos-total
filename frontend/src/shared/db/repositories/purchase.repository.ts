import type { RxCollection } from 'rxdb';
import { Observable, map } from 'rxjs';
import { initDatabase } from '../database';
import type { CreatePurchaseData, PurchaseBox, PurchaseFilter, UpdatePurchaseData } from '../../types/modelTypes/PurchaseBox';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import { config } from '../../config/config';
import type { ICrudBaseRepository } from './interfaces/IRepository';

export interface IPurchaseBoxRepository extends ICrudBaseRepository<PurchaseBox, CreatePurchaseData, UpdatePurchaseData, PurchaseFilter> {

}

export class LocalPurchaseBoxRepository extends BaseRepository<PurchaseBox> implements IPurchaseBoxRepository {

  protected async getCollection(): Promise<RxCollection<PurchaseBox>> {
    const db = await initDatabase();
    return db.purchases;
  }

  async create(data: CreatePurchaseData): Promise<PurchaseBox> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullData: PurchaseBox = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false,
      quantityAvailable: data.quantityPurchased,
    } as PurchaseBox;
    
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<PurchaseBox>): Promise<PurchaseBox | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        console.warn(`❌ Compra con id ${id} no encontrada para actualizar.`);
        return null;
      }

      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar compra ${id}:`, error);
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
    filter?: PurchaseFilter
  ): Promise<ItemsResponse<PurchaseBox>> {
    const collection = await this.getCollection();
    
    const selector: any = { isDeleted: false };
    
    // Filtro de búsqueda
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      selector.$or = [
        { productId: { $regex: normalizedText, $options: 'i' } },
        { receiptNumber: { $regex: normalizedText, $options: 'i' } },
        { supplierId: { $regex: normalizedText, $options: 'i' } },
        { notes: { $regex: normalizedText, $options: 'i' } }
      ];
    }

    // Filtro por proveedor
    if (filter?.supplierId) {
      selector.supplierId = filter.supplierId;
    }

    // Filtro por producto
    if (filter?.productId) {
      selector.productId = filter.productId;
    }

    // Filtro de fechas (usando purchaseDate en lugar de createdAt)
    if (dateFrom || dateTo) {
      selector.purchaseDate = {};
      if (dateFrom) selector.purchaseDate.$gte = dateFrom;
      if (dateTo) selector.purchaseDate.$lte = dateTo;
    }

    const skip = (page - 1) * size;
    const limit = size + 1;
    
    const docs = await collection.find({
      selector,
      sort: [{ isDeleted: 'asc', purchaseDate: 'desc' }],
      skip,
      limit
    }).exec();

    const items = docs.slice(0, size).map(doc => 
      JSON.parse(JSON.stringify(doc.toJSON())) as PurchaseBox
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

  async findById(id: string): Promise<PurchaseBox | null> {
    return await super.findById(id);
  }

  listen$(
    page: number, 
    size: number, 
    searchQuery?: string, 
    dateFrom?: string, 
    dateTo?: string,
    filter?: PurchaseFilter
  ): Observable<PurchaseBox[]> {
    return new Observable<PurchaseBox[]>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          const selector: any = { isDeleted: false };
          
          // Filtro de búsqueda
          if (searchQuery && searchQuery.trim() !== "") {
            const normalizedText = searchQuery.trim().toLowerCase();
            selector.$or = [
              { productId: { $regex: normalizedText, $options: 'i' } },
              { receiptNumber: { $regex: normalizedText, $options: 'i' } },
              { supplierId: { $regex: normalizedText, $options: 'i' } },
              { notes: { $regex: normalizedText, $options: 'i' } }
            ];
          }

          // Filtro por proveedor
          if (filter?.supplierId) {
            selector.supplierId = filter.supplierId;
          }

          // Filtro por producto
          if (filter?.productId) {
            selector.productId = filter.productId;
          }

          // Filtro de fechas
          if (dateFrom || dateTo) {
            selector.purchaseDate = {};
            if (dateFrom) selector.purchaseDate.$gte = dateFrom;
            if (dateTo) selector.purchaseDate.$lte = dateTo;
          }

          const skip = (page - 1) * size;
          
          subscription = collection.find({
            selector,
            sort: [{ isDeleted: 'asc', purchaseDate: 'desc' }],
            skip,
            limit: size
          }).$.pipe(
            map(docs => docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as PurchaseBox))
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

  lisntenById$(id: string): Observable<PurchaseBox | null> {
    return new Observable<PurchaseBox | null>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          subscription = collection.findOne(id).$.pipe(
            map(doc => doc ? JSON.parse(JSON.stringify(doc.toJSON())) as PurchaseBox : null)
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

export class FirestorePurchaseBoxRepository implements IPurchaseBoxRepository {
  create(_data: Omit<PurchaseBox, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<PurchaseBox> {
    throw new Error('Firestore implementation not yet available');
  }
  update(_id: string, _updateData: Partial<PurchaseBox>): Promise<PurchaseBox | null> {
    throw new Error('Firestore implementation not yet available');
  }
  softDelete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  getAll(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string): Promise<ItemsResponse<PurchaseBox>> {
    throw new Error('Firestore implementation not yet available');
  }
  findById(_id: string): Promise<PurchaseBox | null> {
    throw new Error('Firestore implementation not yet available');
  }
  listen$(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string): Observable<PurchaseBox[]> {
    throw new Error('Firestore implementation not yet available');
  }
  lisntenById$(_id: string): Observable<PurchaseBox | null> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localPurchaseBoxRepository = new LocalPurchaseBoxRepository();
export const firestorePurchaseBoxRepository = new FirestorePurchaseBoxRepository();

export const getPurchaseBoxRepository = (): IPurchaseBoxRepository => {
  return config.APP_MODE === 'local' ? localPurchaseBoxRepository : firestorePurchaseBoxRepository;
};
