import type { Client, ClientFilter, CreateClientData, UpdateClientData } from '../../types/Client';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';
import type { ICrudBaseRepository } from './interfaces/IRepository';
import { Observable, map } from 'rxjs';

export interface IClientRepository extends ICrudBaseRepository<Client, CreateClientData, UpdateClientData, ClientFilter> {
}

export class LocalClientRepository extends BaseRepository<Client> implements IClientRepository {
  
  protected async getCollection(): Promise<RxCollection<Client>> {
    const db = await initDatabase();
    return db.clients;
  }

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<Client> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const collection = await this.getCollection();

    // If email provided, prevent duplicates
    if (data.email) {
      const existing = await collection.findOne({ selector: { email: data.email } }).exec();
      if (existing) {
        throw new Error(`Ya existe un cliente con el correo: ${data.email}`);
      }
    }

    const fullData: Client = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false,
    } as Client;

    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: UpdateClientData): Promise<Client | null> {
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar cliente ${id}:`, error);
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
    _filter?: ClientFilter
  ): Promise<ItemsResponse<Client>> {
    const collection = await this.getCollection();

    const selector: any = { isDeleted: false };

    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      selector.$or = [
        { name: { $regex: normalizedText, $options: 'i' } },
        { email: { $regex: normalizedText, $options: 'i' } },
        { phone: { $regex: normalizedText, $options: 'i' } },
        { address: { $regex: normalizedText, $options: 'i' } },
      ];
    }

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
      limit,
    }).exec();

    const items = docs.slice(0, size).map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Client);
    const hasMore = docs.length > size;

    // Estimación del total similar al producto
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
      totalPages,
    };
  }

  async findById(id: string): Promise<Client | null> {
    return await super.findById(id);
  }

  listen$(
    page: number,
    size: number,
    searchQuery?: string,
    dateFrom?: string,
    dateTo?: string,
    _filter?: ClientFilter
  ): Observable<Client[]> {
    return new Observable<Client[]>(subscriber => {
      let subscription: any;

      (async () => {
        try {
          const collection = await this.getCollection();

          const selector: any = { isDeleted: false };

          if (searchQuery && searchQuery.trim() !== "") {
            const normalizedText = searchQuery.trim().toLowerCase();
            selector.$or = [
              { name: { $regex: normalizedText, $options: 'i' } },
              { email: { $regex: normalizedText, $options: 'i' } },
              { phone: { $regex: normalizedText, $options: 'i' } },
              { address: { $regex: normalizedText, $options: 'i' } },
            ];
          }

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
            limit: size,
          }).$.pipe(
            map(docs => docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as Client))
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

  lisntenById$(id: string): Observable<Client | null> {
    return new Observable<Client | null>(subscriber => {
      let subscription: any;

      (async () => {
        try {
          const collection = await this.getCollection();

          subscription = collection.findOne(id).$.pipe(
            map(doc => doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Client : null)
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

export class FirestoreClientRepository implements IClientRepository {
  async create(_clientData: Omit<Client, 'id'>): Promise<Client> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<Client>): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async softDelete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async getAll(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string, _filter?: ClientFilter): Promise<ItemsResponse<Client>> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  listen$(_page: number, _size: number, _searchQuery?: string, _dateFrom?: string, _dateTo?: string, _filter?: ClientFilter): Observable<Client[]> {
    throw new Error('Firestore implementation not yet available');
  }
  lisntenById$(_id: string): Observable<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  // Additional helper stubs (optional)
  async findByEmail(_email: string): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<Client[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localClientRepository = new LocalClientRepository();
export const firestoreClientRepository = new FirestoreClientRepository();

export const getClientRepository = (): IClientRepository => {
  return config.APP_MODE === 'local' ? localClientRepository : firestoreClientRepository;
};
