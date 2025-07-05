import type { Sale } from '@/shared/types/Sales';
import type { ItemsResponse } from '@/shared/types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';

export interface ISaleRepository {
  create(saleData: Sale): Promise<Sale>;
  findById(id: string): Promise<Sale | null>;
  findAll(): Promise<Sale[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Sale>>;
  findByDateRange(dateFrom: string, dateTo: string): Promise<Sale[]>;
  findByDateRangePaginated(page: number, size: number, dateFrom: string, dateTo: string, searchQuery?: string): Promise<ItemsResponse<Sale>>;
  findByFacturedStatus(factured: boolean): Promise<Sale[]>;
  findByFacturedStatusPaginated(page: number, size: number, factured: boolean, searchQuery?: string): Promise<ItemsResponse<Sale>>;
  findByDateRangeAndFacturedStatus(dateFrom: string, dateTo: string, factured: boolean): Promise<Sale[]>;
  findByDateRangeAndFacturedStatusPaginated(page: number, size: number, dateFrom: string, dateTo: string, factured: boolean, searchQuery?: string): Promise<ItemsResponse<Sale>>;
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

    let selector: any = {};

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim();
      selector = {
        $or: [
          { client: { $regex: q, $options: 'i' } },
          { paymentMethod: { $regex: q, $options: 'i' } },
          { createdBy: { $regex: q, $options: 'i' } }
        ]
      };
    }

    const query = db.sales.find({ selector }).sort({ createdAt: 'desc' });
    const all = await query.exec();
    const totalItems = all.length;
    const totalPages = Math.ceil(totalItems / size);
    const offset = (page - 1) * size;
    const paginated = all.slice(offset, offset + size).map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);

    return {
      items: paginated,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async findByDateRange(dateFrom: string, dateTo: string): Promise<Sale[]> {
    const db = await initDatabase();
    const selector = {
      createdAt: {
        $gte: dateFrom,
        $lte: dateTo
      }
    };
    const sales = await db.sales.find({ selector }).sort({ createdAt: 'desc' }).exec();
    return sales.map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
  }

  async findByDateRangePaginated(page: number, size: number, dateFrom: string, dateTo: string, searchQuery?: string): Promise<ItemsResponse<Sale>> {
    const db = await initDatabase();

    let selector: any = {
      createdAt: {
        $gte: dateFrom,
        $lte: dateTo
      }
    };

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim();
      selector = {
        $and: [
          {
            createdAt: {
              $gte: dateFrom,
              $lte: dateTo
            }
          },
          {
            $or: [
              { client: { $regex: q, $options: 'i' } },
              { paymentMethod: { $regex: q, $options: 'i' } },
              { createdBy: { $regex: q, $options: 'i' } }
            ]
          }
        ]
      };
    }

    const query = db.sales.find({ selector }).sort({ createdAt: 'desc' });
    const all = await query.exec();
    const totalItems = all.length;
    const totalPages = Math.ceil(totalItems / size);
    const offset = (page - 1) * size;
    const paginated = all.slice(offset, offset + size).map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);

    return {
      items: paginated,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async findByFacturedStatus(factured: boolean): Promise<Sale[]> {
    const db = await initDatabase();
    const selector = { factured };
    const sales = await db.sales.find({ selector }).sort({ createdAt: 'desc' }).exec();
    return sales.map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
  }

  async findByFacturedStatusPaginated(page: number, size: number, factured: boolean, searchQuery?: string): Promise<ItemsResponse<Sale>> {
    const db = await initDatabase();

    let selector: any = { factured };

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim();
      selector = {
        $and: [
          { factured },
          {
            $or: [
              { client: { $regex: q, $options: 'i' } },
              { paymentMethod: { $regex: q, $options: 'i' } },
              { createdBy: { $regex: q, $options: 'i' } }
            ]
          }
        ]
      };
    }

    const query = db.sales.find({ selector }).sort({ createdAt: 'desc' });
    const all = await query.exec();
    const totalItems = all.length;
    const totalPages = Math.ceil(totalItems / size);
    const offset = (page - 1) * size;
    const paginated = all.slice(offset, offset + size).map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);

    return {
      items: paginated,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async findByDateRangeAndFacturedStatus(dateFrom: string, dateTo: string, factured: boolean): Promise<Sale[]> {
    const db = await initDatabase();
    const selector = {
      $and: [
        {
          createdAt: {
            $gte: dateFrom,
            $lte: dateTo
          }
        },
        { factured }
      ]
    };
    const sales = await db.sales.find({ selector }).sort({ createdAt: 'desc' }).exec();
    return sales.map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
  }

  async findByDateRangeAndFacturedStatusPaginated(page: number, size: number, dateFrom: string, dateTo: string, factured: boolean, searchQuery?: string): Promise<ItemsResponse<Sale>> {
    const db = await initDatabase();

    let selector: any = {
      $and: [
        {
          createdAt: {
            $gte: dateFrom,
            $lte: dateTo
          }
        },
        { factured }
      ]
    };

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim();
      selector = {
        $and: [
          {
            createdAt: {
              $gte: dateFrom,
              $lte: dateTo
            }
          },
          { factured },
          {
            $or: [
              { client: { $regex: q, $options: 'i' } },
              { paymentMethod: { $regex: q, $options: 'i' } },
              { createdBy: { $regex: q, $options: 'i' } }
            ]
          }
        ]
      };
    }

    const query = db.sales.find({ selector }).sort({ createdAt: 'desc' });
    const all = await query.exec();
    const totalItems = all.length;
    const totalPages = Math.ceil(totalItems / size);
    const offset = (page - 1) * size;
    const paginated = all.slice(offset, offset + size).map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);

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
    const q = searchText.trim();
    const selector = {
      $or: [
        { client: { $regex: q, $options: 'i' } },
        { paymentMethod: { $regex: q, $options: 'i' } },
        { createdBy: { $regex: q, $options: 'i' } }
      ]
    };

    const results = await db.sales.find({ selector }).sort({ createdAt: 'desc' }).exec();
    return results.map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
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
  async findByDateRange(_dateFrom: string, _dateTo: string): Promise<Sale[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByDateRangePaginated(_page: number, _size: number, _dateFrom: string, _dateTo: string, _searchQuery?: string): Promise<ItemsResponse<Sale>> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByFacturedStatus(_factured: boolean): Promise<Sale[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByFacturedStatusPaginated(_page: number, _size: number, _factured: boolean, _searchQuery?: string): Promise<ItemsResponse<Sale>> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByDateRangeAndFacturedStatus(_dateFrom: string, _dateTo: string, _factured: boolean): Promise<Sale[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByDateRangeAndFacturedStatusPaginated(_page: number, _size: number, _dateFrom: string, _dateTo: string, _factured: boolean, _searchQuery?: string): Promise<ItemsResponse<Sale>> {
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