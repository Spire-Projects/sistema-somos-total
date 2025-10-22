import type { RxCollection } from 'rxdb';
import { initDatabase } from '../database';
import type { Purchase, CreatePurchaseData, UpdatePurchaseData, PurchaseStatistics } from '../../types/modelTypes/Purchase';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import { config } from '../../config/config';
import { Observable } from 'rxjs';

export interface IPurchaseRepository {
  create(purchaseData: CreatePurchaseData): Promise<Purchase>;
  findById(id: string): Promise<Purchase | null>;
  findAll(): Promise<Purchase[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Purchase>>;
  update(id: string, updateData: UpdatePurchaseData): Promise<Purchase | null>;
  delete(id: string): Promise<boolean>;
  getStatistics(): Promise<PurchaseStatistics>;
  getPurchasesByProduct(productCode: string): Promise<Purchase[]>;
  getPurchasesBySupplier(supplier: string): Promise<Purchase[]>;
  getPurchasesByDateRange(startDate: string, endDate: string): Promise<Purchase[]>;
  getActivePurchases(): Promise<Purchase[]>;
  getDeletedPurchases(): Promise<Purchase[]>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  
  // Métodos para snapshot/listener en tiempo real
  findAllLive$(): Observable<Purchase[]>;
  findAllPaginatedLive$(page: number, size: number, searchQuery?: string): Observable<Purchase[]>;
}

export class LocalPurchaseRepository extends BaseRepository<Purchase> implements IPurchaseRepository {
  
  protected async getCollection(): Promise<RxCollection<Purchase>> {
    const db = await initDatabase();
    return db.purchases;
  }

  async create(purchaseData: CreatePurchaseData): Promise<Purchase> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullPurchaseData = { 
      id, 
      ...purchaseData,
      createdAt: now,
      updatedAt: now,
      sincronized: false,
      isDeleted: false
    };
    
    console.log(`🔄 PurchaseRepository: Creando compra con prioridad`, { id });
    return await this.createWithPriority(fullPurchaseData as Purchase);
  }

  async update(id: string, updateData: UpdatePurchaseData): Promise<Purchase | null> {
    console.log(`🔄 PurchaseRepository: Actualizando compra ${id} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(id, updateData as Partial<Purchase>);
    } catch (error) {
      console.error(`❌ Error actualizando compra ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ PurchaseRepository: Eliminando compra ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<Purchase | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<Purchase[]> {
    return await super.findAll();
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Purchase>> {
    const db = await initDatabase();
    
    const selector: any = { isDeleted: false };
    
    // Búsqueda por productCode, supplier o comprobante
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      selector.$or = [
        { productCode: { $regex: new RegExp(query, 'i') } },
        { supplier: { $regex: new RegExp(query, 'i') } },
        { comprobante: { $regex: new RegExp(query, 'i') } }
      ];
    }

    // Estrategia optimizada: obtener solo los datos necesarios para paginación
    const skip = (page - 1) * size;
    const limit = size + 1; // +1 para saber si hay más páginas
    
    const purchases = await db.purchases.find({
      selector,
      sort: [{ isDeleted: 'asc', date: 'desc' }],
      skip,
      limit
    }).exec();

    const items = purchases.slice(0, size).map((purchase) => 
      JSON.parse(JSON.stringify(purchase.toJSON())) as Purchase
    );
    
    const hasMore = purchases.length > size;
    
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

  async getPurchasesByProduct(productCode: string): Promise<Purchase[]> {
    const db = await initDatabase();
    const purchases = await db.purchases.find({ 
      selector: { 
        isDeleted: false,
        productCode
      },
      sort: [{ isDeleted: 'asc', date: 'desc' }]
    }).exec();
    return purchases.map((purchase) => JSON.parse(JSON.stringify(purchase.toJSON())) as Purchase);
  }

  async getPurchasesBySupplier(supplier: string): Promise<Purchase[]> {
    const db = await initDatabase();
    const purchases = await db.purchases.find({ 
      selector: { 
        isDeleted: false,
        supplier
      },
      sort: [{ isDeleted: 'asc', date: 'desc' }]
    }).exec();
    return purchases.map((purchase) => JSON.parse(JSON.stringify(purchase.toJSON())) as Purchase);
  }

  async getPurchasesByDateRange(startDate: string, endDate: string): Promise<Purchase[]> {
    const db = await initDatabase();
    const purchases = await db.purchases.find({ 
      selector: { 
        isDeleted: false,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      },
      sort: [{ isDeleted: 'asc', date: 'desc' }]
    }).exec();
    return purchases.map((purchase) => JSON.parse(JSON.stringify(purchase.toJSON())) as Purchase);
  }

  async getStatistics(): Promise<PurchaseStatistics> {
    const db = await initDatabase();
    
    // Obtener todas las compras activas
    const activePurchasesDocs = await db.purchases.find({ selector: { isDeleted: false } }).exec();
    const activePurchases = activePurchasesDocs.map((p) => JSON.parse(JSON.stringify(p.toJSON())) as Purchase);
    
    // Obtener compras eliminadas
    const deletedPurchasesDocs = await db.purchases.find({ selector: { isDeleted: true } }).exec();
    
    // Calcular costo total de compras
    const totalCostPurchased = activePurchases.reduce((sum, purchase) => sum + (purchase.totalCost || 0), 0);
    
    // Calcular promedio de costo por compra
    const averageCostPerPurchase = activePurchases.length > 0 
      ? totalCostPurchased / activePurchases.length 
      : 0;

    return {
      totalPurchases: activePurchases.length + deletedPurchasesDocs.length,
      activePurchases: activePurchases.length,
      deletedPurchases: deletedPurchasesDocs.length,
      totalCostPurchased,
      averageCostPerPurchase
    };
  }

  async getActivePurchases(): Promise<Purchase[]> {
    const db = await initDatabase();
    const purchases = await db.purchases.find({ 
      selector: { isDeleted: false },
      sort: [{ isDeleted: 'asc', date: 'desc' }]
    }).exec();
    return purchases.map((p) => JSON.parse(JSON.stringify(p.toJSON())) as Purchase);
  }

  async getDeletedPurchases(): Promise<Purchase[]> {
    const db = await initDatabase();
    const purchases = await db.purchases.find({ 
      selector: { isDeleted: true },
      sort: [{ updatedAt: 'desc' }]
    }).exec();
    return purchases.map((p) => JSON.parse(JSON.stringify(p.toJSON())) as Purchase);
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const db = await initDatabase();
    const purchase = await db.purchases.findOne(id).exec();
    if (!purchase) return false;
    
    await purchase.update({ 
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
    const purchase = await db.purchases.findOne(id).exec();
    if (!purchase) return false;
    
    await purchase.update({ 
      $set: { 
        isDeleted: false,
        updatedAt: new Date().toISOString() 
      } 
    });
    
    return true;
  }

  /**
   * Observable que emite cada vez que cambia la colección de compras (snapshot en tiempo real)
   * Retorna todas las compras activas
   */
  findAllLive$(): Observable<Purchase[]> {
    return new Observable<Purchase[]>((subscriber) => {
      let subscription: any;

      initDatabase()
        .then((db) => {
          // Query reactiva que emite cada vez que hay cambios
          subscription = db.purchases
            .find({
              selector: { isDeleted: false },
              sort: [{ isDeleted: 'asc', date: 'desc' }]
            })
            .$.subscribe((docs) => {
              const purchases = docs.map((doc) => 
                JSON.parse(JSON.stringify(doc.toJSON())) as Purchase
              );
              subscriber.next(purchases);
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
  findAllPaginatedLive$(page: number, size: number, searchQuery?: string): Observable<Purchase[]> {
    return new Observable<Purchase[]>((subscriber) => {
      let subscription: any;

      initDatabase()
        .then((db) => {
          const selector: any = { isDeleted: false };
          
          if (searchQuery && searchQuery.trim() !== "") {
            const query = searchQuery.trim().toLowerCase();
            selector.$or = [
              { productCode: { $regex: new RegExp(query, 'i') } },
              { supplier: { $regex: new RegExp(query, 'i') } },
              { comprobante: { $regex: new RegExp(query, 'i') } }
            ];
          }

          const skip = (page - 1) * size;

          subscription = db.purchases
            .find({
              selector,
              sort: [{ isDeleted: 'asc', date: 'desc' }],
              skip,
              limit: size
            })
            .$.subscribe((docs) => {
              const purchases = docs.map((doc) => 
                JSON.parse(JSON.stringify(doc.toJSON())) as Purchase
              );
              subscriber.next(purchases);
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

export class FirestorePurchaseRepository implements IPurchaseRepository {
  async create(_purchaseData: CreatePurchaseData): Promise<Purchase> {
    throw new Error('Firestore not implemented');
  }
  async findById(_id: string): Promise<Purchase | null> {
    throw new Error('Firestore not implemented');
  }
  async findAll(): Promise<Purchase[]> {
    throw new Error('Firestore not implemented');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<Purchase>> {
    throw new Error('Firestore not implemented');
  }
  async update(_id: string, _updateData: UpdatePurchaseData): Promise<Purchase | null> {
    throw new Error('Firestore not implemented');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  async getStatistics(): Promise<PurchaseStatistics> {
    throw new Error('Firestore not implemented');
  }
  async getPurchasesByProduct(_productCode: string): Promise<Purchase[]> {
    throw new Error('Firestore not implemented');
  }
  async getPurchasesBySupplier(_supplier: string): Promise<Purchase[]> {
    throw new Error('Firestore not implemented');
  }
  async getPurchasesByDateRange(_startDate: string, _endDate: string): Promise<Purchase[]> {
    throw new Error('Firestore not implemented');
  }
  async getActivePurchases(): Promise<Purchase[]> {
    throw new Error('Firestore not implemented');
  }
  async getDeletedPurchases(): Promise<Purchase[]> {
    throw new Error('Firestore not implemented');
  }
  async softDelete(_id: string, _deletedBy: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  async restore(_id: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  findAllLive$(): Observable<Purchase[]> {
    throw new Error('Firestore not implemented');
  }
  findAllPaginatedLive$(_page: number, _size: number, _searchQuery?: string): Observable<Purchase[]> {
    throw new Error('Firestore not implemented');
  }
}

export const localPurchaseRepository = new LocalPurchaseRepository();
export const firestorePurchaseRepository = new FirestorePurchaseRepository();

export const getPurchaseRepository = (): IPurchaseRepository => {
  return config.APP_MODE === 'local' ? localPurchaseRepository : firestorePurchaseRepository;
};
