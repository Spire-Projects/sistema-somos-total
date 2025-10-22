# Repositorios - Guía de Uso

Esta guía documenta el uso de los repositorios para **Sales**, **Products** y **Purchases**, siguiendo el patrón establecido en `client.repository.ts`.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Estructura de Repositorios](#estructura-de-repositorios)
- [Uso Básico](#uso-básico)
- [Métodos Disponibles](#métodos-disponibles)
- [Listeners en Tiempo Real (Snapshots)](#listeners-en-tiempo-real-snapshots)
- [Ejemplos Prácticos](#ejemplos-prácticos)

---

## ✨ Características

- ✅ **Patrón Repository**: Separación de lógica de acceso a datos
- ✅ **BaseRepository**: Herencia para reutilización de código
- ✅ **Optimización de consultas**: Sin uso de `count()` que es lento en RxDB
- ✅ **Paginación inteligente**: Estimación eficiente de totales
- ✅ **Listeners en tiempo real**: Similar a snapshots de Firebase
- ✅ **TypeScript completo**: Tipado fuerte en todas las interfaces
- ✅ **Soft Delete**: Borrado lógico con posibilidad de restaurar
- ✅ **DTOs organizados**: Tipos separados en `modelTypes/`

---

## 🏗️ Estructura de Repositorios

Cada repositorio sigue esta estructura:

```typescript
// Interface del repositorio
export interface IXRepository {
  create(data: CreateXData): Promise<X>;
  findById(id: string): Promise<X | null>;
  findAll(): Promise<X[]>;
  findAllPaginated(...): Promise<ItemsResponse<X>>;
  update(id: string, data: UpdateXData): Promise<X | null>;
  delete(id: string): Promise<boolean>;
  getStatistics(): Promise<XStatistics>;
  // ... métodos específicos
  
  // Listeners en tiempo real
  findAllLive$(): Observable<X[]>;
  findAllPaginatedLive$(...): Observable<X[]>;
}

// Implementación local (RxDB)
export class LocalXRepository extends BaseRepository<X> implements IXRepository {
  // Implementación de métodos
}

// Implementación Firestore (placeholder)
export class FirestoreXRepository implements IXRepository {
  // Métodos lanzan error "not implemented"
}

// Factory function
export const getXRepository = (): IXRepository => {
  return config.APP_MODE === 'local' ? localXRepository : firestoreXRepository;
};
```

---

## 🚀 Uso Básico

### Sales Repository

```typescript
import { getSalesRepository } from '@/shared/db/repositories/sales.repository';
import type { CreateSaleData } from '@/shared/types/modelTypes/Sale';

const salesRepo = getSalesRepository();

// Crear venta
const newSale = await salesRepo.create({
  date: new Date().toISOString(),
  productCode: 'PROD-001',
  quantity: 5,
  unitPrice: 100,
  totalPrice: 500,
  client: 'Juan Pérez',
  comprobante: 'FAC-001',
  createdBy: 'user-123'
});

// Obtener ventas paginadas
const { items, totalPages } = await salesRepo.findAllPaginated(1, 20, 'search query');

// Actualizar venta
await salesRepo.update('sale-id', {
  quantity: 10,
  totalPrice: 1000,
  updatedBy: 'user-123'
});

// Obtener estadísticas
const stats = await salesRepo.getStatistics();
console.log(stats.totalRevenueGenerated);
```

### Products Repository

```typescript
import { getProductRepository } from '@/shared/db/repositories/product.repository';

const productRepo = getProductRepository();

// Crear producto
const newProduct = await productRepo.create({
  code: 'PROD-001',
  name: 'Producto Ejemplo',
  category: 'Electrónica',
  stock: 100,
  unitCost: 50,
  unitPrice: 100,
  createdBy: 'user-123'
});

// Actualizar stock
await productRepo.updateStock('PROD-001', 10, 'add'); // Sumar 10
await productRepo.updateStock('PROD-001', 5, 'subtract'); // Restar 5

// Obtener productos con stock bajo
const lowStock = await productRepo.getLowStockProducts(10);

// Buscar por código
const product = await productRepo.findByCode('PROD-001');
```

### Purchases Repository

```typescript
import { getPurchaseRepository } from '@/shared/db/repositories/purchase.repository';

const purchaseRepo = getPurchaseRepository();

// Crear compra
const newPurchase = await purchaseRepo.create({
  date: new Date().toISOString(),
  productCode: 'PROD-001',
  quantity: 50,
  unitCost: 45,
  totalCost: 2250,
  supplier: 'Proveedor XYZ',
  comprobante: 'COMP-001',
  createdBy: 'user-123'
});

// Obtener compras por producto
const purchases = await purchaseRepo.getPurchasesByProduct('PROD-001');

// Obtener compras por rango de fechas
const purchasesInRange = await purchaseRepo.getPurchasesByDateRange(
  '2025-01-01',
  '2025-12-31'
);
```

---

## 📚 Métodos Disponibles

### Métodos Comunes (todos los repositorios)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `create(data)` | Crea un nuevo registro | `Promise<T>` |
| `findById(id)` | Busca por ID | `Promise<T \| null>` |
| `findAll()` | Obtiene todos los registros activos | `Promise<T[]>` |
| `findAllPaginated(page, size, query?)` | Paginación optimizada | `Promise<ItemsResponse<T>>` |
| `update(id, data)` | Actualiza un registro | `Promise<T \| null>` |
| `delete(id)` | Elimina permanentemente | `Promise<boolean>` |
| `softDelete(id, deletedBy)` | Borrado lógico | `Promise<boolean>` |
| `restore(id)` | Restaura un registro borrado | `Promise<boolean>` |
| `getStatistics()` | Obtiene estadísticas | `Promise<Statistics>` |
| `getActiveX()` | Solo registros activos | `Promise<T[]>` |
| `getDeletedX()` | Solo registros eliminados | `Promise<T[]>` |

### Métodos Específicos

#### Sales Repository
- `getSalesByProduct(productCode)` - Ventas de un producto
- `getSalesByClient(client)` - Ventas de un cliente
- `getSalesByDateRange(start, end)` - Ventas en rango de fechas

#### Products Repository
- `findByCode(code)` - Buscar por código de producto
- `getProductsByCategory(category)` - Productos de una categoría
- `getLowStockProducts(threshold?)` - Productos con stock bajo (default: 10)
- `updateStock(code, quantity, operation)` - Actualizar stock (add/subtract)

#### Purchases Repository
- `getPurchasesByProduct(productCode)` - Compras de un producto
- `getPurchasesBySupplier(supplier)` - Compras de un proveedor
- `getPurchasesByDateRange(start, end)` - Compras en rango de fechas

---

## 🔴 Listeners en Tiempo Real (Snapshots)

Los repositorios incluyen métodos con el sufijo `$` que retornan **Observables de RxJS**, similares a los snapshots de Firebase. Estos se actualizan automáticamente cuando cambian los datos.

### Uso Directo con Observables

```typescript
import { getSalesRepository } from '@/shared/db/repositories/sales.repository';

const salesRepo = getSalesRepository();

// Suscribirse a cambios en ventas
const subscription = salesRepo.findAllLive$().subscribe({
  next: (sales) => {
    console.log('Ventas actualizadas:', sales);
  },
  error: (error) => {
    console.error('Error:', error);
  }
});

// Importante: desuscribirse al finalizar
subscription.unsubscribe();
```

### Uso en React con Hooks Personalizados

Se han creado hooks para facilitar el uso en componentes React:

```typescript
import { useLiveSales, useLiveProducts, useLiveProduct } from '@/shared/hooks/useLiveData';

function SalesListComponent() {
  const { sales, loading, error } = useLiveSales();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {sales.map(sale => (
        <div key={sale.id}>
          {sale.productCode} - {sale.quantity} unidades
        </div>
      ))}
    </div>
  );
}
```

### Hooks Disponibles

| Hook | Descripción |
|------|-------------|
| `useLiveSales()` | Todas las ventas en tiempo real |
| `useLiveSalesPaginated(page, size, query?)` | Ventas paginadas en tiempo real |
| `useLiveProducts()` | Todos los productos en tiempo real |
| `useLiveProductsPaginated(page, size, query?)` | Productos paginados en tiempo real |
| `useLiveProduct(code)` | Un producto específico en tiempo real |
| `useLivePurchases()` | Todas las compras en tiempo real |
| `useLivePurchasesPaginated(page, size, query?)` | Compras paginadas en tiempo real |

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Dashboard con datos en tiempo real

```typescript
import { useLiveSales, useLiveProducts } from '@/shared/hooks/useLiveData';

function Dashboard() {
  const { sales, loading: salesLoading } = useLiveSales();
  const { products, loading: productsLoading } = useLiveProducts();

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
  const lowStockProducts = products.filter(p => (p.stock || 0) < 10);

  return (
    <div>
      <h2>Dashboard en Tiempo Real</h2>
      <div>Ingresos Totales: ${totalRevenue}</div>
      <div>Productos con Stock Bajo: {lowStockProducts.length}</div>
    </div>
  );
}
```

### Ejemplo 2: Mostrar stock de producto en tiempo real

```typescript
import { useLiveProduct } from '@/shared/hooks/useLiveData';

function ProductStock({ productCode }: { productCode: string }) {
  const { product, loading } = useLiveProduct(productCode);

  if (loading) return <span>...</span>;
  if (!product) return <span>No encontrado</span>;

  return (
    <div className={product.stock! < 10 ? 'text-red-500' : ''}>
      Stock: {product.stock} unidades
      {product.stock! < 10 && <span> ⚠️ Stock bajo</span>}
    </div>
  );
}
```

### Ejemplo 3: Lista de ventas con búsqueda y paginación

```typescript
import { useState } from 'react';
import { useLiveSalesPaginated } from '@/shared/hooks/useLiveData';

function SalesList() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { sales, loading } = useLiveSalesPaginated(page, 20, searchQuery);

  return (
    <div>
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar..."
      />
      
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.productCode}</td>
                <td>{sale.quantity}</td>
                <td>${sale.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Anterior
      </button>
      <button onClick={() => setPage(p => p + 1)}>
        Siguiente
      </button>
    </div>
  );
}
```

### Ejemplo 4: Crear venta y actualizar stock automáticamente

```typescript
import { getSalesRepository } from '@/shared/db/repositories/sales.repository';
import { getProductRepository } from '@/shared/db/repositories/product.repository';

async function createSaleAndUpdateStock(
  productCode: string,
  quantity: number,
  userId: string
) {
  const salesRepo = getSalesRepository();
  const productRepo = getProductRepository();

  try {
    // Verificar stock disponible
    const product = await productRepo.findByCode(productCode);
    if (!product || (product.stock || 0) < quantity) {
      throw new Error('Stock insuficiente');
    }

    // Crear la venta
    const sale = await salesRepo.create({
      date: new Date().toISOString(),
      productCode,
      quantity,
      unitPrice: product.unitPrice || 0,
      totalPrice: (product.unitPrice || 0) * quantity,
      createdBy: userId
    });

    // Actualizar stock automáticamente
    await productRepo.updateStock(productCode, quantity, 'subtract');

    console.log('Venta creada y stock actualizado:', sale);
    return sale;
  } catch (error) {
    console.error('Error al crear venta:', error);
    throw error;
  }
}
```

---

## 🎯 Mejores Prácticas

1. **Siempre desuscribirse de Observables**: Los hooks lo hacen automáticamente, pero si usas directamente los observables, recuerda desuscribirte.

2. **Usar paginación**: Para listas grandes, siempre usa `findAllPaginated` en lugar de `findAll`.

3. **Aprovechar los listeners**: Para dashboards y datos que cambian frecuentemente, usa los métodos `*Live$()`.

4. **Validar antes de actualizar**: Siempre verifica que el registro existe antes de actualizar.

5. **Soft delete por defecto**: Usa `softDelete()` en lugar de `delete()` para mantener historial.

6. **Estadísticas en caché**: Las estadísticas pueden ser pesadas, considera cachearlas si no necesitas datos en tiempo real.

---

## 📁 Ubicación de Archivos

```
frontend/src/shared/
├── types/modelTypes/
│   ├── Sale.ts          # Interfaces de Sale + DTOs
│   ├── Product.ts       # Interfaces de Product + DTOs
│   └── Purchase.ts      # Interfaces de Purchase + DTOs
├── db/repositories/
│   ├── sales.repository.ts     # Repositorio de ventas
│   ├── product.repository.ts   # Repositorio de productos
│   └── purchase.repository.ts  # Repositorio de compras
└── hooks/
    └── useLiveData.ts   # Hooks para listeners en tiempo real
```

---

## 🔧 Configuración

El modo de repositorio (local/firestore) se configura en `config.ts`:

```typescript
export const config = {
  APP_MODE: import.meta.env.VITE_APP_MODE || 'local', // 'local' o 'deploy'
  // ...
};
```

---

**¡Listo!** Ya tienes repositorios completos, optimizados y con soporte para listeners en tiempo real. 🎉
