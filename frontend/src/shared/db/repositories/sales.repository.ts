import type { MangoQuery, MangoQuerySelector, RxCollection } from 'rxdb';
import { Observable, map } from 'rxjs';
import { initDatabase } from '../database';
import type { CreateSaleData, Sale, SaleFilter, UpdateSaleData } from '../../types/modelTypes/Sale';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import type { ICrudBaseRepository } from './interfaces/IRepository';
import { config } from '../../config/config';

export interface ISalesRepository extends ICrudBaseRepository<Sale, CreateSaleData, UpdateSaleData, SaleFilter> {
  
}

export class LocalSalesRepository extends BaseRepository<Sale> implements ISalesRepository {
  
  protected async getCollection(): Promise<RxCollection<Sale>> {
    const db = await initDatabase();
    return db.sales;
  }

  async create(data: CreateSaleData): Promise<Sale> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullData: Sale = {
      id,
      ...data,
      factured: data.factured ?? false,
      isDraft: data.isDraft ?? false,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false
    } as Sale;
    
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: UpdateSaleData): Promise<Sale | null> {
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar venta ${id}:`, error);
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
    filter?: SaleFilter
  ): Promise<ItemsResponse<Sale>> {
    const collection = await this.getCollection();

    const selector: MangoQuerySelector<Sale> = { isDeleted: false };

    // Filtro de búsqueda
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      selector.$or = [
        { numberInvoice: { $regex: normalizedText, $options: 'i' } },
        { paymentMethod: { $regex: normalizedText, $options: 'i' } },
        { client: { $regex: normalizedText, $options: 'i' } },
        { nitClient: { $regex: normalizedText, $options: 'i' } },
        { socialReasonClient: { $regex: normalizedText, $options: 'i' } }
      ];
    }

    // Filtro por cliente
    if (filter?.clientId) {
      selector.client = filter.clientId;
    }

    // Filtro por facturado
    if (filter?.factured !== undefined) {
      selector.factured = filter.factured;
    }

    // Filtro por borrador (isDraft) - siempre excluir borradores
    if (filter?.isDraft !== undefined) {
      selector.isDraft = filter.isDraft;
    } else {
      // Por defecto, no mostrar borradores
      selector.isDraft = false;
    }

    // Filtro de fechas
    if (dateFrom || dateTo) {
      selector.createdAt = {};
      if (dateFrom) selector.createdAt.$gte = dateFrom;
      if (dateTo) selector.createdAt.$lte = dateTo;
    }

    const skip = (page - 1) * size;
    const limit = size + 1;
    console.log("Selector:", selector);
    
    const docs = await collection.find({
      selector,
      sort: [{ isDeleted: 'asc', createdAt: 'desc' }],
      skip,
      limit
    }).exec();

    const items = docs.slice(0, size).map(doc => 
      JSON.parse(JSON.stringify(doc.toJSON())) as Sale
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

  async findById(id: string): Promise<Sale | null> {
    return await super.findById(id);
  }

  listen$(
    page: number, 
    size: number, 
    searchQuery?: string, 
    dateFrom?: string, 
    dateTo?: string,
    filter?: SaleFilter
  ): Observable<Sale[]> {
    return new Observable<Sale[]>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          const selector: any = { isDeleted: false };
          
          // Filtro de búsqueda
          if (searchQuery && searchQuery.trim() !== "") {
            const normalizedText = searchQuery.trim().toLowerCase();
            selector.$or = [
              { numberInvoice: { $regex: normalizedText, $options: 'i' } },
              { paymentMethod: { $regex: normalizedText, $options: 'i' } },
              { client: { $regex: normalizedText, $options: 'i' } },
              { nitClient: { $regex: normalizedText, $options: 'i' } },
              { socialReasonClient: { $regex: normalizedText, $options: 'i' } }
            ];
          }

          // Filtro por cliente
          if (filter?.clientId) {
            selector.client = filter.clientId;
          }

          // Filtro por facturado
          if (filter?.factured !== undefined) {
            selector.factured = filter.factured;
          }

          // Filtro por borrador (isDraft) - siempre excluir borradores
          if (filter?.isDraft !== undefined) {
            selector.isDraft = filter.isDraft;
          } else {
            // Por defecto, no mostrar borradores
            selector.isDraft = false;
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
            map(docs => docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Sale))
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

  lisntenById$(id: string): Observable<Sale | null> {
    return new Observable<Sale | null>(subscriber => {
      let subscription: any;
      
      (async () => {
        try {
          const collection = await this.getCollection();
          
          subscription = collection.findOne(id).$.pipe(
            map(doc => doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Sale : null)
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

export class FirestoreSalesRepository implements ISalesRepository {
  create(_data: CreateSaleData): Promise<Sale> {
    throw new Error('Firestore implementation not yet available');
  }
  update(_id: string, _updateData: UpdateSaleData): Promise<Sale | null> {
    throw new Error('Firestore implementation not yet available');
  }
  softDelete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  getAll(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string, _filter?: SaleFilter): Promise<ItemsResponse<Sale>> {
    throw new Error('Firestore implementation not yet available');
  }
  findById(_id: string): Promise<Sale | null> {
    throw new Error('Firestore implementation not yet available');
  }
  listen$(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string, _filter?: SaleFilter): Observable<Sale[]> {
    throw new Error('Firestore implementation not yet available');
  }
  lisntenById$(_id: string): Observable<Sale | null> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localSalesRepository = new LocalSalesRepository();
export const firestoreSalesRepository = new FirestoreSalesRepository();

export const getSalesRepository = (): ISalesRepository => {
  return config.APP_MODE === 'local' ? localSalesRepository : firestoreSalesRepository;
};
