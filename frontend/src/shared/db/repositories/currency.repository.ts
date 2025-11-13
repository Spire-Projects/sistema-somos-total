import type { RxCollection } from 'rxdb';
import { Observable, map } from 'rxjs';
import { initDatabase } from '../database';
import type {
  Currency,
  CreateCurrencyData,
  UpdateCurrencyData,
} from '../../types/modelTypes/Currency';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import type { ICrudBaseRepository } from './interfaces/IRepository';
import { config } from '../../config/config';

export interface ICurrencyRepository
  extends ICrudBaseRepository<Currency, CreateCurrencyData, UpdateCurrencyData, { simbol?: string }> {}

export class LocalCurrencyRepository
  extends BaseRepository<Currency>
  implements ICurrencyRepository
{
  protected async getCollection(): Promise<RxCollection<Currency>> {
    const db = await initDatabase();
    return db.currency;
  }

  async create(data: CreateCurrencyData): Promise<Currency> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    

    const fullData: Currency = {
      id,
      simbol: data.simbol,
      equivalenceToBs: data.equivalenceToBs,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false,
    } ;

    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: UpdateCurrencyData): Promise<Currency | null> {
    try {
      return await this.updateWithPriority(id, updateData as Partial<Currency>);
    } catch (error) {
      console.error(`❌ Error al actualizar currency ${id}:`, error);
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
    filter?: { simbol?: string }
  ): Promise<ItemsResponse<Currency>> {
    const collection = await this.getCollection();

    const selector: any = { isDeleted: false };

    if (searchQuery && searchQuery.trim() !== '') {
      const normalized = searchQuery.trim().toLowerCase();
      selector.$or = [{ simbol: { $regex: normalized, $options: 'i' } }];
    }

    if (filter?.simbol) selector.simbol = filter.simbol;

    if (dateFrom || dateTo) {
      selector.createdAt = {};
      if (dateFrom) selector.createdAt.$gte = dateFrom;
      if (dateTo) selector.createdAt.$lte = dateTo;
    }

    const skip = (page - 1) * size;
    const limit = size + 1;

    const docs = await collection.find({
      selector,
      sort: [{ isDeleted: 'asc', simbol: 'asc' }],
      skip,
      limit,
    }).exec();

    const items = docs.slice(0, size).map((d) => JSON.parse(JSON.stringify(d.toJSON())) as Currency);
    const hasMore = docs.length > size;

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

    return { items, page, size, totalItems, totalPages };
  }

  async findById(id: string): Promise<Currency | null> {
    return await super.findById(id);
  }

  listen$(
    page: number,
    size: number,
    searchQuery?: string,
    dateFrom?: string,
    dateTo?: string,
    filter?: { simbol?: string }
  ): Observable<Currency[]> {
    return new Observable<Currency[]>((subscriber) => {
      let subscription: any;

      (async () => {
        try {
          const collection = await this.getCollection();
          const selector: any = { isDeleted: false };

          if (searchQuery && searchQuery.trim() !== '') {
            const normalized = searchQuery.trim().toLowerCase();
            selector.$or = [{ simbol: { $regex: normalized, $options: 'i' } }];
          }

          if (filter?.simbol) selector.simbol = filter.simbol;

          if (dateFrom || dateTo) {
            selector.createdAt = {};
            if (dateFrom) selector.createdAt.$gte = dateFrom;
            if (dateTo) selector.createdAt.$lte = dateTo;
          }

          const skip = (page - 1) * size;

          subscription = collection.find({
            selector,
            sort: [{ isDeleted: 'asc', simbol: 'asc' }],
            skip,
            limit: size,
          }).$.pipe(
            map((docs) => docs.map((doc) => JSON.parse(JSON.stringify(doc.toJSON())) as Currency))
          ).subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => subscriber.error(err),
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

  lisntenById$(id: string): Observable<Currency | null> {
    return new Observable<Currency | null>((subscriber) => {
      let subscription: any;

      (async () => {
        try {
          const collection = await this.getCollection();
          subscription = collection.findOne(id).$.pipe(
            map((doc) => (doc ? (JSON.parse(JSON.stringify(doc.toJSON())) as Currency) : null))
          ).subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => subscriber.error(err),
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

export class FirestoreCurrencyRepository implements ICurrencyRepository {
  create(_data: CreateCurrencyData): Promise<Currency> {
    throw new Error('Firestore implementation not yet available');
  }
  update(_id: string, _updateData: UpdateCurrencyData): Promise<Currency | null> {
    throw new Error('Firestore implementation not yet available');
  }
  softDelete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  getAll(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string): Promise<ItemsResponse<Currency>> {
    throw new Error('Firestore implementation not yet available');
  }
  findById(_id: string): Promise<Currency | null> {
    throw new Error('Firestore implementation not yet available');
  }
  listen$(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string): Observable<Currency[]> {
    throw new Error('Firestore implementation not yet available');
  }
  lisntenById$(_id: string): Observable<Currency | null> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localCurrencyRepository = new LocalCurrencyRepository();
export const firestoreCurrencyRepository = new FirestoreCurrencyRepository();

export const getCurrencyRepository = (): ICurrencyRepository => {
  return config.APP_MODE === 'local' ? localCurrencyRepository : firestoreCurrencyRepository;
};
