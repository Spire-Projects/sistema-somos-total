import type { Sale } from '@/shared/types/Sales';
import type { ItemsResponse } from '@/shared/types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';

export interface ISaleRepository {
  create(saleData: Sale): Promise<Sale>;
  findById(id: string): Promise<Sale | null>;
  findAll(): Promise<Sale[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Sale>>;
  delete(id: string): Promise<boolean>;
  search(searchText: string): Promise<Sale[]>;
}

export class LocalSaleRepository implements ISaleRepository {
  async create(saleData: Sale): Promise<Sale> {
    const db = await initDatabase();
    const sale = await db.sales.insert(saleData);
    return JSON.parse(JSON.stringify(sale.toJSON())) as Sale;
  }

  async findById(id: string): Promise<Sale | null> {
    const db = await initDatabase();
    const sale = await db.sales.findOne(id).exec();
    return sale ? JSON.parse(JSON.stringify(sale.toJSON())) as Sale : null;
  }

  async findAll(): Promise<Sale[]> {
    const db = await initDatabase();
    const sales = await db.sales.find().sort({ createdAt: 'desc' }).exec();
    return sales.map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Sale>> {
    const db = await initDatabase();

    let query = db.sales.find();

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      query = db.sales.find({
        selector: {
          $or: [
            { client: { $regex: q, $options: 'i' } },
            { paymentMethod: { $regex: q, $options: 'i' } }
          ]
        }
      });
    }

    const all = await query.sort({ createdAt: 'desc' }).exec();
    const totalItems = all.length;
    const totalPages = Math.ceil(totalItems / size);
    const paginated = all.slice((page - 1) * size, page * size).map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);

    return {
      items: paginated,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const sale = await db.sales.findOne(id).exec();
    if (!sale) return false;
    await sale.remove();
    return true;
  }

  async search(searchText: string): Promise<Sale[]> {
    if (!searchText || searchText.trim() === '') {
      return this.findAll();
    }

    const db = await initDatabase();
    const q = searchText.trim().toLowerCase();
    const results = await db.sales.find().exec();
    const filtered = results.filter(s => {
      const json = JSON.parse(JSON.stringify(s.toJSON())) as Sale;
      return json.client.toLowerCase().includes(q) || json.paymentMethod.toLowerCase().includes(q);
    });

    return filtered.map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
  }
}

export class FirestoreSaleRepository implements ISaleRepository {
  async create(_saleData: Sale): Promise<Sale> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<Sale | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<Sale[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<Sale>> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async search(_searchText: string): Promise<Sale[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localSaleRepository = new LocalSaleRepository();
export const firestoreSaleRepository = new FirestoreSaleRepository();

export const getSaleRepository = (): ISaleRepository => {
  return config.APP_MODE === 'local' ? localSaleRepository : firestoreSaleRepository;
};