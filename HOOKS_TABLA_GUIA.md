# Guía de Hooks de Tabla con Real-time

## 📋 Descripción General

Los hooks de tabla proporcionan una interfaz completa para gestionar tablas de datos con:
- ✅ **Paginación** inteligente sin count()
- ✅ **Búsqueda** con debounce configurable
- ✅ **Filtros** específicos por entidad
- ✅ **Ordenamiento** flexible
- ✅ **Actualización en tiempo real** vía RxDB Observables
- ✅ **Métodos específicos** de cada entidad

## 🏗️ Arquitectura

```
useDataTable (Base genérico)
    ├── useProductTable (Productos)
    ├── useSaleTable (Ventas)
    └── usePurchaseTable (Compras)
```

### Hook Base: `useDataTable`

Hook genérico reutilizable que implementa toda la lógica común de tablas.

**Parámetros:**
```typescript
interface UseDataTableParams<TFilters, TSort> {
  initialPage?: number;           // Página inicial (default: 1)
  initialPageSize?: number;        // Tamaño de página (default: 20)
  initialFilters?: TFilters;       // Filtros iniciales
  initialSort?: TSort;             // Ordenamiento inicial
  enableRealtime?: boolean;        // Activar listeners (default: false)
  debounceMs?: number;             // Debounce para búsqueda (default: 300ms)
}
```

**Retorno:**
```typescript
interface UseDataTableReturn<TEntity, TFilters, TSort> {
  // Data
  data: ItemsResponse<TEntity> | null;
  items: TEntity[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Search & Filters
  searchQuery: string;
  filters: TFilters;
  sort: TSort | undefined;
  
  // Actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (query: string) => void;
  setFilters: (filters: TFilters) => void;
  setSort: (sort: TSort | undefined) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}
```

---

## 🛒 Hook de Productos: `useProductTable`

### Filtros Disponibles

```typescript
interface ProductFilters {
  category?: string;           // Categoría del producto
  minStock?: number;           // Stock mínimo
  maxStock?: number;           // Stock máximo
  minPrice?: number;           // Precio mínimo
  maxPrice?: number;           // Precio máximo
  status?: 'active' | 'inactive';
  isLowStock?: boolean;        // Solo productos con bajo stock
}
```

### Ordenamiento

```typescript
interface ProductSort {
  field: 'name' | 'code' | 'price' | 'stock' | 'category' | 'createdAt';
  direction: 'asc' | 'desc';
}
```

### Métodos Específicos

```typescript
{
  getLowStockProducts: () => Promise<Product[]>;
  getProductByCode: (code: string) => Promise<Product | null>;
  updateStock: (code: string, quantity: number, operation: 'add' | 'subtract') => Promise<void>;
}
```

### Ejemplo de Uso

```typescript
import { useProductTable } from '@/shared/hooks';

function ProductsPage() {
  const products = useProductTable({
    initialPageSize: 20,
    enableRealtime: true,
    initialFilters: { isLowStock: true },
    initialSort: { field: 'name', direction: 'asc' }
  });

  // Buscar productos
  const handleSearch = (query: string) => {
    products.setSearch(query);
  };

  // Filtrar por categoría
  const handleCategoryFilter = (category: string) => {
    products.setFilters({ category });
  };

  // Ordenar por precio
  const handleSortByPrice = () => {
    products.setSort({ field: 'price', direction: 'asc' });
  };

  // Obtener productos con bajo stock
  const loadLowStock = async () => {
    const lowStockItems = await products.getLowStockProducts();
    console.log('Productos con bajo stock:', lowStockItems);
  };

  // Actualizar stock
  const handleStockUpdate = async (code: string) => {
    try {
      await products.updateStock(code, 10, 'add');
      toast.success('Stock actualizado');
    } catch (error) {
      toast.error('Error actualizando stock');
    }
  };

  if (products.loading) return <Spinner />;
  if (products.error) return <Error message={products.error} />;

  return (
    <div>
      <SearchBar value={products.searchQuery} onChange={handleSearch} />
      
      <ProductTable items={products.items} />
      
      <Pagination
        currentPage={products.currentPage}
        totalPages={products.totalPages}
        onPageChange={products.setPage}
        onNext={products.nextPage}
        onPrevious={products.previousPage}
      />
    </div>
  );
}
```

---

## 💰 Hook de Ventas: `useSaleTable`

### Filtros Disponibles

```typescript
interface SaleFilters {
  clientId?: string;
  clientName?: string;
  startDate?: Date;
  endDate?: Date;
  minTotal?: number;
  maxTotal?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  status?: 'active' | 'cancelled';
}
```

### Ordenamiento

```typescript
interface SaleSort {
  field: 'date' | 'total' | 'clientName' | 'createdAt';
  direction: 'asc' | 'desc';
}
```

### Métodos Específicos

```typescript
{
  getSalesByClient: (clientId: string) => Promise<Sale[]>;
  getSalesByDateRange: (startDate: string, endDate: string) => Promise<Sale[]>;
  getDailySalesTotal: (date?: string) => Promise<{ total: number; count: number }>;
  cancelSale: (saleId: string, deletedBy: string) => Promise<void>;
  getTopSellingProducts: (limit?: number) => Promise<Array<{
    productCode: string;
    totalSold: number;
    revenue: number;
  }>>;
}
```

### Ejemplo de Uso

```typescript
import { useSaleTable } from '@/shared/hooks';

function SalesPage() {
  const sales = useSaleTable({
    initialPageSize: 20,
    enableRealtime: true,
    initialSort: { field: 'date', direction: 'desc' }
  });

  // Filtrar por rango de fechas
  const handleDateFilter = () => {
    sales.setFilters({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    });
  };

  // Obtener total del día
  const loadDailyTotal = async () => {
    const { total, count } = await sales.getDailySalesTotal();
    console.log(`Total del día: $${total} (${count} ventas)`);
  };

  // Cancelar venta
  const handleCancelSale = async (saleId: string) => {
    try {
      await sales.cancelSale(saleId, currentUserId);
      toast.success('Venta cancelada');
    } catch (error) {
      toast.error('Error cancelando venta');
    }
  };

  // Productos más vendidos
  const loadTopProducts = async () => {
    const topProducts = await sales.getTopSellingProducts(10);
    console.log('Top 10 productos:', topProducts);
  };

  return (
    <div>
      <SalesFilters
        onDateFilter={handleDateFilter}
        onSearch={sales.setSearch}
      />
      
      <SalesTable 
        items={sales.items}
        onCancel={handleCancelSale}
      />
      
      <Pagination {...sales} />
    </div>
  );
}
```

---

## 📦 Hook de Compras: `usePurchaseTable`

### Filtros Disponibles

```typescript
interface PurchaseFilters {
  supplierId?: string;
  supplierName?: string;
  startDate?: Date;
  endDate?: Date;
  minTotal?: number;
  maxTotal?: number;
  status?: 'active' | 'cancelled';
}
```

### Ordenamiento

```typescript
interface PurchaseSort {
  field: 'date' | 'total' | 'supplierName' | 'createdAt';
  direction: 'asc' | 'desc';
}
```

### Métodos Específicos

```typescript
{
  getPurchasesBySupplier: (supplierId: string) => Promise<Purchase[]>;
  getPurchasesByDateRange: (startDate: string, endDate: string) => Promise<Purchase[]>;
  cancelPurchase: (purchaseId: string, deletedBy: string) => Promise<void>;
  getTopSuppliers: (limit?: number) => Promise<Array<{
    supplier: string;
    totalPurchases: number;
    totalSpent: number;
  }>>;
  getAveragePurchaseCost: (productCode: string) => Promise<{
    averageCost: number;
    totalPurchases: number;
  }>;
}
```

### Ejemplo de Uso

```typescript
import { usePurchaseTable } from '@/shared/hooks';

function PurchasesPage() {
  const purchases = usePurchaseTable({
    initialPageSize: 20,
    enableRealtime: true,
    initialSort: { field: 'date', direction: 'desc' }
  });

  // Filtrar por proveedor
  const handleSupplierFilter = (supplierId: string) => {
    purchases.setFilters({ supplierId });
  };

  // Top proveedores
  const loadTopSuppliers = async () => {
    const topSuppliers = await purchases.getTopSuppliers(5);
    console.log('Top 5 proveedores:', topSuppliers);
  };

  // Costo promedio de producto
  const loadAverageCost = async (productCode: string) => {
    const { averageCost, totalPurchases } = await purchases.getAveragePurchaseCost(productCode);
    console.log(`Costo promedio: $${averageCost} (${totalPurchases} compras)`);
  };

  // Cancelar compra
  const handleCancelPurchase = async (purchaseId: string) => {
    try {
      await purchases.cancelPurchase(purchaseId, currentUserId);
      toast.success('Compra cancelada');
    } catch (error) {
      toast.error('Error cancelando compra');
    }
  };

  return (
    <div>
      <PurchaseFilters
        onSupplierFilter={handleSupplierFilter}
        onSearch={purchases.setSearch}
      />
      
      <PurchaseTable 
        items={purchases.items}
        onCancel={handleCancelPurchase}
      />
      
      <Pagination {...purchases} />
    </div>
  );
}
```

---

## ⚡ Características Avanzadas

### 1. Real-time Updates (Opcional)

Los hooks pueden trabajar en dos modos:

**Modo Normal (fetch):**
```typescript
const products = useProductTable({
  enableRealtime: false // Usa findAllPaginated() del servicio
});
```

**Modo Real-time (Observable):**
```typescript
const products = useProductTable({
  enableRealtime: true // Usa findAllPaginatedLive$() del servicio
});
```

### 2. Debounce Personalizado

Controla el tiempo de espera antes de ejecutar búsquedas:

```typescript
const products = useProductTable({
  debounceMs: 500 // Espera 500ms después de escribir
});
```

### 3. Reseteo Automático de Página

Al cambiar búsqueda, filtros u ordenamiento, la página se resetea a 1 automáticamente:

```typescript
// Esto automáticamente vuelve a página 1
products.setSearch('laptop');
products.setFilters({ category: 'electronics' });
products.setSort({ field: 'price', direction: 'asc' });
```

### 4. Refresh Manual

Forzar recarga de datos en cualquier momento:

```typescript
await products.refresh();
```

### 5. Navegación de Páginas

Múltiples formas de navegar:

```typescript
// Cambio directo
products.setPage(5);

// Navegación relativa
products.nextPage();
products.previousPage();

// Saltos
products.goToFirstPage();
products.goToLastPage();
```

### 6. Limpiar Filtros

Resetear todos los filtros, búsqueda y ordenamiento:

```typescript
products.clearFilters();
```

---

## 🔧 Integración con Servicios

Los hooks requieren que los servicios implementen esta interfaz:

```typescript
interface DataTableService<TEntity, TFilters, TSort> {
  // Método requerido
  findAllPaginated(
    page: number,
    size: number,
    searchQuery?: string,
    filters?: TFilters,
    sort?: TSort
  ): Promise<{ success: boolean; data?: ItemsResponse<TEntity>; error?: string }>;
  
  // Método opcional para real-time
  findAllPaginatedLive$?(
    page: number,
    size: number,
    searchQuery?: string,
    filters?: TFilters,
    sort?: TSort
  ): Observable<TEntity[]>;
}
```

**Nota:** Actualmente los servicios solo implementan `findAllPaginated()` sin filtros ni sort. Para soporte completo, se deben actualizar los servicios.

---

## 📊 Ejemplo Completo con Todo

```typescript
import { useProductTable } from '@/shared/hooks';
import { useState } from 'react';

function ProductManagementPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const products = useProductTable({
    initialPageSize: 25,
    enableRealtime: true,
    initialSort: { field: 'name', direction: 'asc' },
    debounceMs: 400
  });

  // Handler compuesto: búsqueda + filtro + ordenamiento
  const handleAdvancedFilter = () => {
    products.setSearch('laptop');
    products.setFilters({
      category: 'electronics',
      minStock: 5,
      maxPrice: 1000
    });
    products.setSort({ field: 'price', direction: 'asc' });
  };

  // Cargar datos adicionales
  const loadDashboardData = async () => {
    const lowStock = await products.getLowStockProducts();
    console.log('Productos con bajo stock:', lowStock.length);
  };

  // Actualizar stock masivo
  const handleBulkStockUpdate = async (codes: string[]) => {
    for (const code of codes) {
      await products.updateStock(code, 10, 'add');
    }
    toast.success(`${codes.length} productos actualizados`);
  };

  return (
    <div className="p-6">
      {/* Header con controles */}
      <div className="mb-4 space-y-2">
        <SearchBar
          value={products.searchQuery}
          onChange={products.setSearch}
          placeholder="Buscar productos..."
        />
        
        <div className="flex gap-2">
          <CategorySelect
            value={selectedCategory}
            onChange={(cat) => {
              setSelectedCategory(cat);
              products.setFilters({ ...products.filters, category: cat });
            }}
          />
          
          <Button onClick={handleAdvancedFilter}>
            Filtro Avanzado
          </Button>
          
          <Button onClick={products.clearFilters} variant="outline">
            Limpiar Filtros
          </Button>
          
          <Button onClick={products.refresh}>
            <RefreshIcon /> Refrescar
          </Button>
        </div>
      </div>

      {/* Estado de carga */}
      {products.loading && <Spinner />}
      {products.error && <Alert variant="error">{products.error}</Alert>}

      {/* Tabla */}
      <ProductTable
        items={products.items}
        onStockUpdate={(code, qty) => products.updateStock(code, qty, 'add')}
      />

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando {products.items.length} de {products.totalItems} productos
        </div>
        
        <div className="flex gap-2">
          <Button
            disabled={!products.hasPreviousPage}
            onClick={products.previousPage}
          >
            Anterior
          </Button>
          
          <span className="px-4 py-2">
            Página {products.currentPage} de {products.totalPages}
          </span>
          
          <Button
            disabled={!products.hasNextPage}
            onClick={products.nextPage}
          >
            Siguiente
          </Button>
        </div>
        
        <select
          value={products.pageSize}
          onChange={(e) => products.setPageSize(Number(e.target.value))}
          className="px-3 py-1 border rounded"
        >
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
          <option value={100}>100 por página</option>
        </select>
      </div>
    </div>
  );
}
```

---

## 🎯 Mejores Prácticas

1. **Siempre habilitar real-time para datos que cambian frecuentemente**
   ```typescript
   const sales = useSaleTable({ enableRealtime: true });
   ```

2. **Usar debounce apropiado según el caso**
   - Búsqueda de texto: 300-500ms
   - Filtros numéricos: 100-200ms

3. **Manejar errores en métodos específicos**
   ```typescript
   try {
     await products.updateStock(code, qty, 'add');
   } catch (error) {
     toast.error('Error actualizando stock');
   }
   ```

4. **Aprovechar el refresh automático después de mutaciones**
   - Los métodos `updateStock`, `cancelSale`, `cancelPurchase` ya hacen refresh

5. **Combinar múltiples filtros de forma progresiva**
   ```typescript
   products.setFilters({ 
     ...products.filters, 
     category: newCategory 
   });
   ```

---

## 🚀 Próximas Mejoras

- [ ] Agregar soporte de filtros y ordenamiento en servicios
- [ ] Implementar cache de resultados
- [ ] Agregar modo offline-first
- [ ] Optimizar observables con shareReplay()
- [ ] Agregar tests unitarios
