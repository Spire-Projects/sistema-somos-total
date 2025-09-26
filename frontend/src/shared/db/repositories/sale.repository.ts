import type { Sale } from '@/shared/types/Sales';
import type { ItemsResponse } from '@/shared/types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';

export interface ISaleRepository {
  create(saleData: Sale): Promise<Sale>;
  update(id: string, updateData: Partial<Sale>): Promise<Sale>;
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
  getHighestInvoiceNumber(): Promise<number>;
}

export class LocalSaleRepository extends BaseRepository<Sale> implements ISaleRepository {
  
  protected async getCollection(): Promise<RxCollection<Sale>> {
    const db = await initDatabase();
    return db.sales;
  }

  async create(saleData: Sale): Promise<Sale> {
    console.log(`🔄 SaleRepository: Creando venta con prioridad`, { id: saleData.id });
    return await this.createWithPriority(saleData);
  }

  async update(id: string, updateData: Partial<Sale>): Promise<Sale> {
    console.log(`🔄 SaleRepository: Actualizando venta ${id} con prioridad`, updateData);
    return await this.updateWithPriority(id, updateData);
  }

  async findById(id: string): Promise<Sale | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<Sale[]> {
    return await super.findAll();
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ SaleRepository: Eliminando venta ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Sale>> {
    const db = await initDatabase();

    let selector: any = {};

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim();
      selector = {
        $or: [
          { client: { $regex: q, $options: 'i' } },
          { numberInvoice: { $regex: q, $options: 'i' } },
          { paymentMethod: { $regex: q, $options: 'i' } },
          { createdBy: { $regex: q, $options: 'i' } },
          { idMedic: { $regex: q, $options: 'i' } }
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
      selector =        {
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
                { numberInvoice: { $regex: q, $options: 'i' } },
                { paymentMethod: { $regex: q, $options: 'i' } },
                { createdBy: { $regex: q, $options: 'i' } },
                { idMedic: { $regex: q, $options: 'i' } }
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
      selector =        {
          $and: [
            { factured },
            {
              $or: [
                { client: { $regex: q, $options: 'i' } },
                { numberInvoice: { $regex: q, $options: 'i' } },
                { paymentMethod: { $regex: q, $options: 'i' } },
                { createdBy: { $regex: q, $options: 'i' } },
                { idMedic: { $regex: q, $options: 'i' } }
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
                { numberInvoice: { $regex: q, $options: 'i' } },
              { paymentMethod: { $regex: q, $options: 'i' } },
              { createdBy: { $regex: q, $options: 'i' } },
              { idMedic: { $regex: q, $options: 'i' } }
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



  async search(searchText: string): Promise<Sale[]> {
    if (!searchText || searchText.trim() === '') {
      return this.findAll();
    }

    const db = await initDatabase();
    const q = searchText.trim();
    const selector = {
      $or: [
        { client: { $regex: q, $options: 'i' } },
        { numberInvoice: { $regex: q, $options: 'i' } },
        { paymentMethod: { $regex: q, $options: 'i' } },
        { createdBy: { $regex: q, $options: 'i' } },
        { idMedic: { $regex: q, $options: 'i' } }
      ]
    };

    const results = await db.sales.find({ selector }).sort({ createdAt: 'desc' }).exec();
    return results.map(s => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
  }

  async getHighestInvoiceNumber(): Promise<number> {
    const db = await initDatabase();
    
    // Obtener todas las ventas ordenadas por numero de factura descendente
    const sales = await db.sales.find().sort({ numberInvoice: 'desc' }).limit(1).exec();
    
    if (sales.length === 0) {
      return 0; // Si no hay ventas, empezar desde 0
    }

    const highestSale = sales[0];
    const invoiceNumber = highestSale.numberInvoice || "0000000";
    
    // Convertir el string a número (remover ceros a la izquierda)
    const numericValue = parseInt(invoiceNumber, 10);
    
    return isNaN(numericValue) ? 0 : numericValue;
  }
}

export class FirestoreSaleRepository implements ISaleRepository {
  async create(_saleData: Sale): Promise<Sale> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<Sale>): Promise<Sale> {
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
  async getHighestInvoiceNumber(): Promise<number> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localSaleRepository = new LocalSaleRepository();
export const firestoreSaleRepository = new FirestoreSaleRepository();

export const getSaleRepository = (): ISaleRepository => {
  return config.APP_MODE === 'local' ? localSaleRepository : firestoreSaleRepository;
};