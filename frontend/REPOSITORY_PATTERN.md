# Patrón de Repositorio Abstracto

## 📋 Interfaz Base Creada

Se ha creado una interfaz abstracta `IBaseRepository<T>` en `/shared/db/repositories/interfaces/IRepository.ts` que define las operaciones CRUD esenciales que todo repositorio debe implementar.

### Operaciones Esenciales

```typescript
interface IBaseRepository<T> {
  create(data): Promise<T>;
  findById(id): Promise<T | null>;
  findAll(): Promise<T[]>;
  findAllPaginated(page, size, searchQuery?): Promise<ItemsResponse<T>>;
  update(id, updateData): Promise<T | null>;
  delete(id): Promise<boolean>;
  getDeletedItems(): Promise<T[]>;
  getActiveItems(): Promise<T[]>;
  softDelete(id, deletedBy): Promise<boolean>;
  restore(id): Promise<boolean>;
}
```

## 🔄 Refactorización Recomendada

### Paso 1: Implementar BaseRepository Genérico

```typescript
// /shared/db/repositories/BaseRepository.ts
export abstract class BaseRepository<T extends IEntity> implements IBaseRepository<T> {
  protected abstract getCollection(): Promise<RxCollection<T>>;

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'sincronized'>): Promise<T> {
    const db = await this.getCollection();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullData = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sincronized: false
    } as T;
    
    await db.insert(fullData);
    return fullData;
  }

  async findById(id: string): Promise<T | null> {
    const db = await this.getCollection();
    const doc = await db.findOne(id).exec();
    return doc ? (JSON.parse(JSON.stringify(doc.toJSON())) as T) : null;
  }

  async findAll(): Promise<T[]> {
    const db = await this.getCollection();
    const docs = await db.find({ selector: { isDeleted: false } }).exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as T);
  }

  async findAllPaginated(
    page: number,
    size: number,
    searchQuery?: string
  ): Promise<ItemsResponse<T>> {
    const db = await this.getCollection();
    const selector = { isDeleted: false };
    
    // Lógica de búsqueda si existe searchQuery
    // ...
    
    const skip = (page - 1) * size;
    const docs = await db.find({ selector, skip, limit: size + 1 }).exec();
    
    const items = docs.slice(0, size).map(doc => 
      JSON.parse(JSON.stringify(doc.toJSON())) as T
    );
    
    const hasMore = docs.length > size;
    const totalItems = hasMore ? skip + size + 10 : skip + items.length;
    const totalPages = Math.ceil(totalItems / size);
    
    return { items, page, size, totalItems, totalPages };
  }

  async update(id: string, updateData: Partial<T>): Promise<T | null> {
    const db = await this.getCollection();
    const doc = await db.findOne(id).exec();
    if (!doc) return null;
    
    await doc.update({
      $set: {
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as T;
  }

  async delete(id: string): Promise<boolean> {
    const db = await this.getCollection();
    const doc = await db.findOne(id).exec();
    if (!doc) return false;
    
    await doc.remove();
    return true;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const db = await this.getCollection();
    const doc = await db.findOne(id).exec();
    if (!doc) return false;
    
    await doc.update({
      $set: {
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date().toISOString()
      }
    });
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const db = await this.getCollection();
    const doc = await db.findOne(id).exec();
    if (!doc) return false;
    
    await doc.update({
      $set: {
        isDeleted: false,
        updatedAt: new Date().toISOString()
      }
    });
    return true;
  }

  async getActiveItems(): Promise<T[]> {
    const db = await this.getCollection();
    const docs = await db.find({ selector: { isDeleted: false } }).exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as T);
  }

  async getDeletedItems(): Promise<T[]> {
    const db = await this.getCollection();
    const docs = await db.find({ selector: { isDeleted: true } }).exec();
    return docs.map(doc => JSON.parse(JSON.stringify(doc.toJSON())) as T);
  }
}
```

### Paso 2: Simplificar ClientRepository

```typescript
// ANTES (actual): ~150 líneas de código repetitivo
export class LocalClientRepository extends BaseRepository<Client> implements IClientRepository {
  // 70 líneas de implementación genérica (create, findById, findAll, etc.)
  // + métodos específicos del dominio
}

// DESPUÉS: ~50 líneas (solo métodos específicos)
export class LocalClientRepository 
  extends BaseRepository<Client> 
  implements IRepositoryWithStatistics<Client> {
  
  protected async getCollection(): Promise<RxCollection<Client>> {
    const db = await initDatabase();
    return db.clients;
  }

  async findByEmail(email: string): Promise<Client | null> {
    const db = await this.getCollection();
    const client = await db.clients.findOne({
      selector: { isDeleted: false, email }
    }).exec();
    return client ? JSON.parse(JSON.stringify(client.toJSON())) as Client : null;
  }

  async addSaleToHistory(clientId: string, saleId: string): Promise<Client | null> {
    const client = await this.findById(clientId);
    if (!client) return null;
    
    return await this.update(clientId, {
      ...client,
      salesHistory: [...(client.salesHistory || []), saleId],
      lastPurchaseDate: new Date().toISOString()
    });
  }

  async getStatistics(): Promise<IRepositoryStatistics> {
    const total = await this.getCollection().then(c => c.find().exec());
    const active = await this.getActiveItems();
    const deleted = await this.getDeletedItems();
    
    return {
      totalItems: total.length,
      activeItems: active.length,
      deletedItems: deleted.length
    };
  }
}
```

## 🎯 Beneficios de Este Patrón

| Aspecto | Beneficio |
|--------|----------|
| **DRY** | Eliminamos 70% de código duplicado |
| **Type Safety** | Todo genericizado con TypeScript |
| **Consistencia** | Todas las operaciones CRUD igual |
| **Mantenimiento** | Cambios centralizados en BaseRepository |
| **Testing** | Fácil de mockear con la interfaz |
| **Escalabilidad** | Nuevos repositorios en 20 líneas |

## 📦 Aplicación a Otros Repositorios

### ProductRepository

```typescript
export class LocalProductRepository 
  extends BaseRepository<Product> 
  implements IRepositoryWithStatistics<Product> {
  
  protected async getCollection(): Promise<RxCollection<Product>> {
    const db = await initDatabase();
    return db.products;
  }

  // Solo métodos específicos de Product:
  async findByCode(code: string): Promise<Product | null> {
    // ...
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    // ...
  }

  async getStatistics(): Promise<ProductStatistics> {
    // ...
  }
}
```

### PurchaseRepository

```typescript
export class LocalPurchaseRepository 
  extends BaseRepository<Purchase> 
  implements IRepositoryWithStatistics<Purchase> {
  
  protected async getCollection(): Promise<RxCollection<Purchase>> {
    const db = await initDatabase();
    return db.purchases;
  }

  // Solo métodos específicos:
  async findByProductId(productId: string): Promise<Purchase[]> {
    // ...
  }

  async findBySupplierId(supplierId: string): Promise<Purchase[]> {
    // ...
  }

  async getStatistics(): Promise<PurchaseStatistics> {
    // ...
  }
}
```

## 🚀 Próximos Pasos

1. ✅ Interfaz `IBaseRepository<T>` creada
2. ⏳ Implementar `BaseRepository<T>` genérico
3. ⏳ Refactorizar `ClientRepository` para extender BaseRepository
4. ⏳ Refactorizar `ProductRepository`
5. ⏳ Refactorizar `PurchaseRepository`
6. ⏳ Refactorizar `SaleRepository`

---

**Nota**: Este patrón sigue **Repository Pattern** con **Generic Abstraction**, permitiendo que cada repositorio específico solo implemente su lógica de negocio única, no operaciones CRUD repetitivas.
