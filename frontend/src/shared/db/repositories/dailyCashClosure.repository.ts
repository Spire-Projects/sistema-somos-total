import type { DailyCashClosure, CreateDaylyCashClosure, UpdateDailyCashClosure, DailyCashClosureFilter } from '@/shared/types/DailyCashClosure';
import type { ItemsResponse } from '@/shared/types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';
import type { ICrudBaseRepository } from './interfaces/IRepository';
import { Observable, map } from 'rxjs';

export interface IDailyCashClosureRepository extends ICrudBaseRepository<DailyCashClosure, CreateDaylyCashClosure, UpdateDailyCashClosure, DailyCashClosureFilter> {}

export class LocalDailyCashClosureRepository extends BaseRepository<DailyCashClosure> implements IDailyCashClosureRepository {
  protected async getCollection(): Promise<RxCollection<DailyCashClosure>> {
    const db = await initDatabase();
    return db.daily_cash_closures;
  }

  async create(data: CreateDaylyCashClosure): Promise<DailyCashClosure> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const fullData: DailyCashClosure = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false,
    };

    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: UpdateDailyCashClosure): Promise<DailyCashClosure | null> {
    try {
      return await this.updateWithPriority(id, updateData as any);
    } catch (error) {
      console.error(`❌ Error al actualizar cierre diario ${id}:`, error);
      return null;
    }
  }

  async softDelete(id: string): Promise<boolean> {
    return await this.deleteWithPriority(id);
  }

  async getAll(
    page: number,
    size: number,
    _searchQuery?: string,
    dateFrom?: string,
    dateTo?: string,
    _filter?: DailyCashClosureFilter
  ): Promise<ItemsResponse<DailyCashClosure>> {
    const collection = await this.getCollection();

    const selector: any = { isDeleted: false };

    // Filtrado por fechas (campo `date` que representa la fecha del cierre)
    if (dateFrom || dateTo) {
      selector.date = {};
      if (dateFrom) selector.date.$gte = dateFrom;
      if (dateTo) selector.date.$lte = dateTo;
    }

    const skip = (page - 1) * size;
    const limit = size + 1;

    const docs = await collection.find({
      selector,
      sort: [{ isDeleted: 'asc' }, { date: 'desc' }],
      skip,
      limit
    }).exec();

    const items = docs.slice(0, size).map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as DailyCashClosure);
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

    return {
      items,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async findById(id: string): Promise<DailyCashClosure | null> {
    return await super.findById(id);
  }

  listen$(
    page: number,
    size: number,
    _searchQuery?: string,
    dateFrom?: string,
    dateTo?: string,
    _filter?: DailyCashClosureFilter
  ): Observable<DailyCashClosure[]> {
    return new Observable<DailyCashClosure[]>(subscriber => {
      let subscription: any;

      (async () => {
        try {
          const collection = await this.getCollection();

          const selector: any = { isDeleted: false };

          if (dateFrom || dateTo) {
            selector.date = {};
            if (dateFrom) selector.date.$gte = dateFrom;
            if (dateTo) selector.date.$lte = dateTo;
          }

          const skip = (page - 1) * size;

          subscription = collection.find({
            selector,
            sort: [{ isDeleted: 'asc' }, { date: 'desc' }],
            skip,
            limit: size
          }).$.pipe(
            map(docs => docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as DailyCashClosure))
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

  lisntenById$(id: string): Observable<DailyCashClosure | null> {
    return new Observable<DailyCashClosure | null>(subscriber => {
      let subscription: any;

      (async () => {
        try {
          const collection = await this.getCollection();

          subscription = collection.findOne(id).$.pipe(
            map(doc => doc ? JSON.parse(JSON.stringify(doc.toJSON())) as DailyCashClosure : null)
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

export class FirestoreDailyCashClosureRepository implements IDailyCashClosureRepository {
  async create(_data: CreateDaylyCashClosure): Promise<DailyCashClosure> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: UpdateDailyCashClosure): Promise<DailyCashClosure | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async softDelete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async getAll(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string, _filter?: DailyCashClosureFilter): Promise<ItemsResponse<DailyCashClosure>> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<DailyCashClosure | null> {
    throw new Error('Firestore implementation not yet available');
  }
  listen$(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string, _filter?: DailyCashClosureFilter): Observable<DailyCashClosure[]> {
    throw new Error('Firestore implementation not yet available');
  }
  lisntenById$(_id: string): Observable<DailyCashClosure | null> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localDailyCashClosureRepository = new LocalDailyCashClosureRepository();
export const firestoreDailyCashClosureRepository = new FirestoreDailyCashClosureRepository();

export const getDailyCashClosureRepository = (): IDailyCashClosureRepository => {
  return config.APP_MODE === 'local' ? localDailyCashClosureRepository : firestoreDailyCashClosureRepository;
};

