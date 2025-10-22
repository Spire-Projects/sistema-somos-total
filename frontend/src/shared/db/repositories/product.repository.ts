import type { RxCollection } from 'rxdb';
import { initDatabase } from '../database';
import type { Product, CreateProductData, UpdateProductData, ProductStatistics } from '../../types/modelTypes/Product';
import type { ItemsResponse } from '../../types/UtilTypes';
import { BaseRepository } from './BaseRepository';
import { config } from '../../config/config';
import { Observable } from 'rxjs';

export interface IProductRepository {
  create(productData: CreateProductData): Promise<Product>;
  findByCode(code: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Product>>;
  update(code: string, updateData: UpdateProductData): Promise<Product | null>;
  delete(code: string): Promise<boolean>;
  getStatistics(): Promise<ProductStatistics>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getDeletedProducts(): Promise<Product[]>;
  softDelete(code: string, deletedBy: string): Promise<boolean>;
  restore(code: string): Promise<boolean>;
  updateStock(code: string, quantity: number, operation: 'add' | 'subtract'): Promise<Product | null>;
  
  // Métodos para snapshot/listener en tiempo real
  findAllLive$(): Observable<Product[]>;
  findAllPaginatedLive$(page: number, size: number, searchQuery?: string): Observable<Product[]>;
  findByCodeLive$(code: string): Observable<Product | null>;
}

export class LocalProductRepository extends BaseRepository<Product> implements IProductRepository {
  
  protected async getCollection(): Promise<RxCollection<Product>> {
    const db = await initDatabase();
    return db.products;
  }

  async create(productData: CreateProductData): Promise<Product> {
    const now = new Date().toISOString();
    
    const fullProductData = { 
      ...productData,
      createdAt: now,
      updatedAt: now,
      sincronized: false,
      isDeleted: false,
      stock: productData.stock || 0
    };
    
    console.log(`🔄 ProductRepository: Creando producto`, { code: productData.code });
    
    // Para productos usamos insert directo ya que el primaryKey es 'code', no 'id'
    const collection = await this.getCollection();
    const doc = await collection.insert(fullProductData as any);
    return JSON.parse(JSON.stringify(doc.toJSON())) as Product;
  }

  async update(code: string, updateData: UpdateProductData): Promise<Product | null> {
    console.log(`🔄 ProductRepository: Actualizando producto ${code} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(code, updateData as Partial<Product>);
    } catch (error) {
      console.error(`❌ Error actualizando producto ${code}:`, error);
      return null;
    }
  }

  async delete(code: string): Promise<boolean> {
    console.log(`🗑️ ProductRepository: Eliminando producto ${code} con prioridad`);
    return await this.deleteWithPriority(code);
  }

  async findByCode(code: string): Promise<Product | null> {
    return await super.findById(code);
  }

  async findAll(): Promise<Product[]> {
    return await super.findAll();
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Product>> {
    const db = await initDatabase();
    
    const selector: any = { isDeleted: false };
    
    // Búsqueda por código, nombre o categoría
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      selector.$or = [
        { code: { $regex: new RegExp(query, 'i') } },
        { name: { $regex: new RegExp(query, 'i') } },
        { category: { $regex: new RegExp(query, 'i') } }
      ];
    }

    // Estrategia optimizada: obtener solo los datos necesarios para paginación
    const skip = (page - 1) * size;
    const limit = size + 1; // +1 para saber si hay más páginas
    
    const products = await db.products.find({
      selector,
      sort: [{ isDeleted: 'asc', name: 'asc' }],
      skip,
      limit
    }).exec();

    const items = products.slice(0, size).map((product) => 
      JSON.parse(JSON.stringify(product.toJSON())) as Product
    );
    
    const hasMore = products.length > size;
    
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

  async getProductsByCategory(category: string): Promise<Product[]> {
    const db = await initDatabase();
    const products = await db.products.find({ 
      selector: { 
        isDeleted: false,
        category
      },
      sort: [{ isDeleted: 'asc', name: 'asc' }]
    }).exec();
    return products.map((product) => JSON.parse(JSON.stringify(product.toJSON())) as Product);
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const db = await initDatabase();
    const products = await db.products.find({ 
      selector: { 
        isDeleted: false,
        stock: { $lte: threshold }
      },
      sort: [{ stock: 'asc' }]
    }).exec();
    return products.map((product) => JSON.parse(JSON.stringify(product.toJSON())) as Product);
  }

  async updateStock(code: string, quantity: number, operation: 'add' | 'subtract'): Promise<Product | null> {
    const db = await initDatabase();
    const product = await db.products.findOne(code).exec();
    if (!product) return null;
    
    const productData = product.toJSON();
    const currentStock = productData.stock || 0;
    const newStock = operation === 'add' 
      ? currentStock + quantity 
      : Math.max(0, currentStock - quantity); // No permitir stock negativo
    
    await product.update({ 
      $set: { 
        stock: newStock,
        updatedAt: new Date().toISOString() 
      } 
    });
    
    return JSON.parse(JSON.stringify(product.toJSON())) as Product;
  }

  async getStatistics(): Promise<ProductStatistics> {
    const db = await initDatabase();
    
    // Obtener todos los productos activos
    const activeProductsDocs = await db.products.find({ selector: { isDeleted: false } }).exec();
    const activeProducts = activeProductsDocs.map((p) => JSON.parse(JSON.stringify(p.toJSON())) as Product);
    
    // Obtener productos eliminados
    const deletedProductsDocs = await db.products.find({ selector: { isDeleted: true } }).exec();
    
    // Calcular stock total
    const totalStock = activeProducts.reduce((sum, product) => sum + (product.stock || 0), 0);
    
    // Contar productos con stock bajo (< 10)
    const lowStockProducts = activeProducts.filter(p => (p.stock || 0) < 10).length;

    return {
      totalProducts: activeProducts.length + deletedProductsDocs.length,
      activeProducts: activeProducts.length,
      deletedProducts: deletedProductsDocs.length,
      totalStock,
      lowStockProducts
    };
  }

  async getActiveProducts(): Promise<Product[]> {
    const db = await initDatabase();
    const products = await db.products.find({ 
      selector: { isDeleted: false },
      sort: [{ isDeleted: 'asc', name: 'asc' }]
    }).exec();
    return products.map((p) => JSON.parse(JSON.stringify(p.toJSON())) as Product);
  }

  async getDeletedProducts(): Promise<Product[]> {
    const db = await initDatabase();
    const products = await db.products.find({ 
      selector: { isDeleted: true },
      sort: [{ updatedAt: 'desc' }]
    }).exec();
    return products.map((p) => JSON.parse(JSON.stringify(p.toJSON())) as Product);
  }

  async softDelete(code: string, deletedBy: string): Promise<boolean> {
    const db = await initDatabase();
    const product = await db.products.findOne(code).exec();
    if (!product) return false;
    
    await product.update({ 
      $set: { 
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date().toISOString() 
      } 
    });
    
    return true;
  }

  async restore(code: string): Promise<boolean> {
    const db = await initDatabase();
    const product = await db.products.findOne(code).exec();
    if (!product) return false;
    
    await product.update({ 
      $set: { 
        isDeleted: false,
        updatedAt: new Date().toISOString() 
      } 
    });
    
    return true;
  }

  /**
   * Observable que emite cada vez que cambia la colección de productos (snapshot en tiempo real)
   * Retorna todos los productos activos
   */
  findAllLive$(): Observable<Product[]> {
    return new Observable<Product[]>((subscriber) => {
      let subscription: any;

      initDatabase()
        .then((db) => {
          // Query reactiva que emite cada vez que hay cambios
          subscription = db.products
            .find({
              selector: { isDeleted: false },
              sort: [{ isDeleted: 'asc', name: 'asc' }]
            })
            .$.subscribe((docs) => {
              const products = docs.map((doc) => 
                JSON.parse(JSON.stringify(doc.toJSON())) as Product
              );
              subscriber.next(products);
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
  findAllPaginatedLive$(page: number, size: number, searchQuery?: string): Observable<Product[]> {
    return new Observable<Product[]>((subscriber) => {
      let subscription: any;

      initDatabase()
        .then((db) => {
          const selector: any = { isDeleted: false };
          
          if (searchQuery && searchQuery.trim() !== "") {
            const query = searchQuery.trim().toLowerCase();
            selector.$or = [
              { code: { $regex: new RegExp(query, 'i') } },
              { name: { $regex: new RegExp(query, 'i') } },
              { category: { $regex: new RegExp(query, 'i') } }
            ];
          }

          const skip = (page - 1) * size;

          subscription = db.products
            .find({
              selector,
              sort: [{ isDeleted: 'asc', name: 'asc' }],
              skip,
              limit: size
            })
            .$.subscribe((docs) => {
              const products = docs.map((doc) => 
                JSON.parse(JSON.stringify(doc.toJSON())) as Product
              );
              subscriber.next(products);
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

  /**
   * Observable que emite cada vez que cambia un producto específico
   */
  findByCodeLive$(code: string): Observable<Product | null> {
    return new Observable<Product | null>((subscriber) => {
      let subscription: any;

      initDatabase()
        .then((db) => {
          subscription = db.products
            .findOne(code)
            .$.subscribe((doc) => {
              const product = doc 
                ? JSON.parse(JSON.stringify(doc.toJSON())) as Product
                : null;
              subscriber.next(product);
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

export class FirestoreProductRepository implements IProductRepository {
  async create(_productData: CreateProductData): Promise<Product> {
    throw new Error('Firestore not implemented');
  }
  async findByCode(_code: string): Promise<Product | null> {
    throw new Error('Firestore not implemented');
  }
  async findAll(): Promise<Product[]> {
    throw new Error('Firestore not implemented');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<Product>> {
    throw new Error('Firestore not implemented');
  }
  async update(_code: string, _updateData: UpdateProductData): Promise<Product | null> {
    throw new Error('Firestore not implemented');
  }
  async delete(_code: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  async getStatistics(): Promise<ProductStatistics> {
    throw new Error('Firestore not implemented');
  }
  async getProductsByCategory(_category: string): Promise<Product[]> {
    throw new Error('Firestore not implemented');
  }
  async getLowStockProducts(_threshold?: number): Promise<Product[]> {
    throw new Error('Firestore not implemented');
  }
  async getActiveProducts(): Promise<Product[]> {
    throw new Error('Firestore not implemented');
  }
  async getDeletedProducts(): Promise<Product[]> {
    throw new Error('Firestore not implemented');
  }
  async softDelete(_code: string, _deletedBy: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  async restore(_code: string): Promise<boolean> {
    throw new Error('Firestore not implemented');
  }
  async updateStock(_code: string, _quantity: number, _operation: 'add' | 'subtract'): Promise<Product | null> {
    throw new Error('Firestore not implemented');
  }
  findAllLive$(): Observable<Product[]> {
    throw new Error('Firestore not implemented');
  }
  findAllPaginatedLive$(_page: number, _size: number, _searchQuery?: string): Observable<Product[]> {
    throw new Error('Firestore not implemented');
  }
  findByCodeLive$(_code: string): Observable<Product | null> {
    throw new Error('Firestore not implemented');
  }
}

export const localProductRepository = new LocalProductRepository();
export const firestoreProductRepository = new FirestoreProductRepository();

export const getProductRepository = (): IProductRepository => {
  return config.APP_MODE === 'local' ? localProductRepository : firestoreProductRepository;
};
