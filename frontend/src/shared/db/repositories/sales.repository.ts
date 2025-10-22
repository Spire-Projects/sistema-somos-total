import type { RxCollection } from 'rxdb';
import { initDatabase } from '../database';
import type { Sale, CreateSaleData, UpdateSaleData, SalesStatistics } from '../../types/modelTypes/Sale';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import { config } from '../../config/config';
import { Observable } from 'rxjs';

export interface ISalesRepository {
  create(saleData: CreateSaleData): Promise<Sale>;
  findById(id: string): Promise<Sale | null>;
  findAll(): Promise<Sale[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Sale>>;
  update(id: string, updateData: UpdateSaleData): Promise<Sale | null>;
  delete(id: string): Promise<boolean>;
  getStatistics(): Promise<SalesStatistics>;
  getSalesByProduct(productCode: string): Promise<Sale[]>;
  getSalesByClient(client: string): Promise<Sale[]>;
  getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]>;
  getActiveSales(): Promise<Sale[]>;
  getDeletedSales(): Promise<Sale[]>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  
  // Método para snapshot/listener en tiempo real
  findAllLive$(): Observable<Sale[]>;
  findAllPaginatedLive$(page: number, size: number, searchQuery?: string): Observable<Sale[]>;
}

export class LocalSalesRepository extends BaseRepository<Sale> implements ISalesRepository {
  
  protected async getCollection(): Promise<RxCollection<Sale>> {
    const db = await initDatabase();
    return db.sales;
  }

  async create(saleData: CreateSaleData): Promise<Sale> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullSaleData = { 
      id, 
      ...saleData,
      createdAt: now,
      updatedAt: now,
      sincronized: false,
      isDeleted: false
    };
    
    console.log(`🔄 SalesRepository: Creando venta con prioridad`, { id });
    return await this.createWithPriority(fullSaleData as Sale);
  }

  async update(id: string, updateData: UpdateSaleData): Promise<Sale | null> {
    console.log(`🔄 SalesRepository: Actualizando venta ${id} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(id, updateData as Partial<Sale>);
    } catch (error) {
      console.error(`❌ Error actualizando venta ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ SalesRepository: Eliminando venta ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<Sale | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<Sale[]> {
    return await super.findAll();
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Sale>> {
    const db = await initDatabase();
    
    const selector: any = { isDeleted: false };
    
    // Búsqueda por productCode, client o comprobante
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      selector.$or = [
        { productCode: { $regex: new RegExp(query, 'i') } },
        { client: { $regex: new RegExp(query, 'i') } },
        { comprobante: { $regex: new RegExp(query, 'i') } }
      ];
    }

    // Estrategia optimizada: obtener solo los datos necesarios para paginación
    const skip = (page - 1) * size;
    const limit = size + 1; // +1 para saber si hay más páginas
    
    const sales = await db.sales.find({
      selector,
      sort: [{ isDeleted: 'asc', date: 'desc' }],
      skip,
      limit
    }).exec();

    const items = sales.slice(0, size).map((sale) => 
      JSON.parse(JSON.stringify(sale.toJSON())) as Sale
    );
    
    const hasMore = sales.length > size;
    
    // Estimación inteligente del total sin usar count()
    let totalItems: number;
    let totalPages: number;
    
    if (page === 1 && !hasMore) {
      // Primera página y no hay más = este es el total
      totalItems = items.length;
      totalPages = 1;
    } else if (page === 1 && hasMore) {
      // Primera página con más páginas = estimamos conservadoramente
      totalItems = size * 10; // Estimación conservadora
      totalPages = 10;
    } else {
      // Páginas subsecuentes = mantenemos estimación
      totalItems = size * 10;
      totalPages = 10;
    }

    return {
      items,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async getSalesByProduct(productCode: string): Promise<Sale[]> {
    const db = await initDatabase();
    const sales = await db.sales.find({ 
      selector: { 
        isDeleted: false,
        productCode
      },
      sort: [{ isDeleted: 'asc', date: 'desc' }]
    }).exec();
    return sales.map((sale) => JSON.parse(JSON.stringify(sale.toJSON())) as Sale);
  }

  async getSalesByClient(client: string): Promise<Sale[]> {
    const db = await initDatabase();
    const sales = await db.sales.find({ 
      selector: { 
        isDeleted: false,
        client
      },
      sort: [{ isDeleted: 'asc', date: 'desc' }]
    }).exec();
    return sales.map((sale) => JSON.parse(JSON.stringify(sale.toJSON())) as Sale);
  }

  async getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    const db = await initDatabase();
    const sales = await db.sales.find({ 
      selector: { 
        isDeleted: false,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      },
      sort: [{ isDeleted: 'asc', date: 'desc' }]
    }).exec();
    return sales.map((sale) => JSON.parse(JSON.stringify(sale.toJSON())) as Sale);
  }

  async getStatistics(): Promise<SalesStatistics> {
    const db = await initDatabase();
    
    // Obtener todas las ventas activas
    const activeSalesDocs = await db.sales.find({ selector: { isDeleted: false } }).exec();
    const activeSales = activeSalesDocs.map((s) => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
    
    // Obtener ventas eliminadas
    const deletedSalesDocs = await db.sales.find({ selector: { isDeleted: true } }).exec();
    
    // Calcular ingresos totales
    const totalRevenueGenerated = activeSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    
    // Calcular promedio de ingresos por venta
    const averageRevenuePerSale = activeSales.length > 0 
      ? totalRevenueGenerated / activeSales.length 
      : 0;
    
    // Calcular productos más vendidos
    const productSales = new Map<string, number>();
    activeSales.forEach(sale => {
      const current = productSales.get(sale.productCode) || 0;
      productSales.set(sale.productCode, current + (sale.quantity || 0));
    });
    
    const topProductsById = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([productCode]) => productCode);

    return {
      totalSales: activeSales.length + deletedSalesDocs.length,
      activeSales: activeSales.length,
      deletedSales: deletedSalesDocs.length,
      totalRevenueGenerated,
      averageRevenuePerSale,
      topProductsById
    };
  }

  async getActiveSales(): Promise<Sale[]> {
    const db = await initDatabase();
    const sales = await db.sales.find({ 
      selector: { isDeleted: false },
      sort: [{ isDeleted: 'asc', date: 'desc' }]
    }).exec();
    return sales.map((s) => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
  }

  async getDeletedSales(): Promise<Sale[]> {
    const db = await initDatabase();
    const sales = await db.sales.find({ 
      selector: { isDeleted: true },
      sort: [{ updatedAt: 'desc' }]
    }).exec();
    return sales.map((s) => JSON.parse(JSON.stringify(s.toJSON())) as Sale);
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const db = await initDatabase();
    const sale = await db.sales.findOne(id).exec();
    if (!sale) return false;
    
    await sale.update({ 
      $set: { 
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date().toISOString() 
      } 
    });
    
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const db = await initDatabase();
    const sale = await db.sales.findOne(id).exec();
    if (!sale) return false;
    
    await sale.update({ 
      $set: { 
        isDeleted: false,
        updatedAt: new Date().toISOString() 
      } 
    });
    
    return true;
  }

  /**
   * Observable que emite cada vez que cambia la colección de ventas (snapshot en tiempo real)
   * Retorna todas las ventas activas
   */
  findAllLive$(): Observable<Sale[]> {
    return new Observable<Sale[]>((subscriber) => {
      let subscription: any;

      initDatabase()
        .then((db) => {
          // Query reactiva que emite cada vez que hay cambios
          subscription = db.sales
            .find({
              selector: { isDeleted: false },
              sort: [{ isDeleted: 'asc', date: 'desc' }]
            })
            .$.subscribe((docs) => {
              const sales = docs.map((doc) => 
                JSON.parse(JSON.stringify(doc.toJSON())) as Sale
              );
              subscriber.next(sales);
            });
        })
        .catch((error) => {
          subscriber.error(error);
        });

      // Cleanup al desuscribirse
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    });
  }

  /**
   * Observable paginado que emite cada vez que cambia la colección
   */
  findAllPaginatedLive$(page: number, size: number, searchQuery?: string): Observable<Sale[]> {
    return new Observable<Sale[]>((subscriber) => {
      let subscription: any;

      initDatabase()
        .then((db) => {
          const selector: any = { isDeleted: false };
          
          if (searchQuery && searchQuery.trim() !== "") {
            const query = searchQuery.trim().toLowerCase();
            selector.$or = [
              { productCode: { $regex: new RegExp(query, 'i') } },
              { client: { $regex: new RegExp(query, 'i') } },
              { comprobante: { $regex: new RegExp(query, 'i') } }
            ];
          }

          const skip = (page - 1) * size;

          subscription = db.sales
            .find({
              selector,
              sort: [{ isDeleted: 'asc', date: 'desc' }],
              skip,
              limit: size
            })
            .$.subscribe((docs) => {
              const sales = docs.map((doc) => 
                JSON.parse(JSON.stringify(doc.toJSON())) as Sale
              );
              subscriber.next(sales);
            });
        })
        .catch((error) => {
          subscriber.error(error);
        });

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    });
  }
}

export class FirestoreSalesRepository implements ISalesRepository {
  async create(_saleData: CreateSaleData): Promise<Sale> {
    throw new Error('Firestore not implemented');
  }
  async findById(_id: string): Promise<Sale | null> {
    throw new Error('Firestore not implemented');
  }
  async findAll(): Promise<Sale[]> {
    throw new Error('Firestore not implemented');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<Sale>> {
    throw new Error('Firestore not implemented');
  }
  async update(_id: string, _updateData: UpdateSaleData): Promise<Sale | null> {
    throw new Error('Firestore not implemented');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  async getStatistics(): Promise<SalesStatistics> {
    throw new Error('Firestore not implemented');
  }
  async getSalesByProduct(_productCode: string): Promise<Sale[]> {
    throw new Error('Firestore not implemented');
  }
  async getSalesByClient(_client: string): Promise<Sale[]> {
    throw new Error('Firestore not implemented');
  }
  async getSalesByDateRange(_startDate: string, _endDate: string): Promise<Sale[]> {
    throw new Error('Firestore not implemented');
  }
  async getActiveSales(): Promise<Sale[]> {
    throw new Error('Firestore not implemented');
  }
  async getDeletedSales(): Promise<Sale[]> {
    throw new Error('Firestore not implemented');
  }
  async softDelete(_id: string, _deletedBy: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  async restore(_id: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  findAllLive$(): Observable<Sale[]> {
    throw new Error('Firestore not implemented');
  }
  findAllPaginatedLive$(_page: number, _size: number, _searchQuery?: string): Observable<Sale[]> {
    throw new Error('Firestore not implemented');
  }
}

export const localSalesRepository = new LocalSalesRepository();
export const firestoreSalesRepository = new FirestoreSalesRepository();

export const getSalesRepository = (): ISalesRepository => {
  return config.APP_MODE === 'local' ? localSalesRepository : firestoreSalesRepository;
};
