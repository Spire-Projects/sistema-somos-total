# Guía de Hooks y Servicios - Sistema SOMOS Total

## 📚 Tabla de Contenidos
- [Arquitectura General](#arquitectura-general)
- [Hooks Disponibles](#hooks-disponibles)
- [BaseService](#baseservice)
- [Ejemplo Completo](#ejemplo-completo)
- [Buenas Prácticas](#buenas-prácticas)

---

## 🏗️ Arquitectura General

La arquitectura sigue el patrón de capas:

```
┌─────────────────────────────────────┐
│   Componentes / Páginas (UI)       │
├─────────────────────────────────────┤
│   Hooks (useEntityData)             │
├─────────────────────────────────────┤
│   Servicios (BaseService)           │
├─────────────────────────────────────┤
│   Repositorios (BaseRepository)     │
├─────────────────────────────────────┤
│   RxDB / Firestore                  │
└─────────────────────────────────────┘
```

### Responsabilidades por capa:

- **Componentes**: Renderizado UI y experiencia de usuario
- **Hooks**: Gestión de estado, paginación, búsqueda y filtros
- **Servicios**: Lógica de negocio y transformación de datos (Entity → View)
- **Repositorios**: Acceso a datos y persistencia
- **Base de datos**: Almacenamiento local (RxDB) o remoto (Firestore)

---

## 🪝 Hooks Disponibles

### 1. `useDebounce`
Hook simple para aplicar debounce a cualquier valor.

```typescript
import { useDebounce } from '@/shared/hooks';

const searchQuery = 'buscar producto';
const debouncedSearch = useDebounce(searchQuery, 300); // 300ms delay
```

**Cuándo usar:**
- Búsquedas en tiempo real
- Validaciones que no deben ejecutarse en cada tecla
- Llamadas a APIs que deben esperar que el usuario termine de escribir

---

### 2. `usePagination`
Hook especializado para manejar estado de paginación.

```typescript
import { usePagination } from '@/shared/hooks';

const pagination = usePagination({
  initialPage: 1,
  initialPageSize: 20,
});

// Acciones disponibles
pagination.setPage(2);
pagination.nextPage();
pagination.previousPage();
pagination.goToFirstPage();
pagination.goToLastPage();
pagination.setPageSize(50);
pagination.reset();
```

**Props disponibles:**
- `currentPage`, `pageSize`, `totalItems`, `totalPages`
- `hasNextPage`, `hasPreviousPage`
- Todas las acciones mencionadas arriba

---

### 3. `useEntityData` ⭐ (Principal)
Hook completo para gestionar entidades con paginación, búsqueda y filtros.

```typescript
import { useEntityData } from '@/shared/hooks';
import { productService } from '@/shared/services/ProductService';
import type { ProductView, ProductFilter } from '@/shared/types/modelTypes/Product';

const {
  // Data
  items,
  loading,
  error,

  // Pagination
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  hasNextPage,
  hasPreviousPage,

  // Search & Filters
  searchQuery,
  debouncedSearch,
  filters,
  dateFrom,
  dateTo,

  // Actions - Pagination
  setPage,
  setPageSize,
  nextPage,
  previousPage,
  goToFirstPage,
  goToLastPage,

  // Actions - Search & Filters
  setSearch,
  setFilters,
  setDateRange,
  clearFilters,

  // Actions - General
  refresh,
} = useEntityData<any, ProductView, ProductFilter>(productService, {
  initialPageSize: 20,
  enableRealtime: false, // true para listeners en tiempo real
  debounceMs: 300,
});
```

**Parámetros:**
- `service`: Instancia del servicio (debe extender `BaseService`)
- `initialPage`: Página inicial (default: 1)
- `initialPageSize`: Tamaño de página inicial (default: 20)
- `initialSearch`: Búsqueda inicial
- `initialFilters`: Filtros iniciales
- `initialDateFrom`, `initialDateTo`: Rango de fechas inicial
- `enableRealtime`: Habilita listeners en tiempo real (default: false)
- `debounceMs`: Tiempo de debounce en ms (default: 300)

---

## 🔧 BaseService

Clase base abstracta para todos los servicios. Encapsula la lógica común de CRUD y transformación de datos.

### Estructura:

```typescript
import { BaseService } from '@/shared/services/BaseService';
import type { Product, ProductView, CreateProductData, UpdateProductData, ProductFilter } from '../types/modelTypes/Product';
import { getProductRepository } from '../db/repositories/product.repository';

class ProductService extends BaseService<
  Product,           // TEntity - Modelo base
  ProductView,       // TView - Modelo con campos resueltos
  CreateProductData, // TCreate - Datos para crear
  UpdateProductData, // TUpdate - Datos para actualizar
  ProductFilter      // TFilter - Filtros específicos
> {
  constructor() {
    super(getProductRepository());
  }

  /**
   * Método obligatorio: Transforma entidad base a vista
   * Aquí resuelves relaciones, calculas campos, etc.
   */
  protected async toView(entity: Product): Promise<ProductView> {
    // Aquí puedes:
    // - Resolver IDs a nombres (ej: categoryId → categoryName)
    // - Calcular campos derivados (ej: stock total)
    // - Formatear datos para UI
    return {
      ...entity,
      categoryName: entity.category, // Ejemplo: resolver categoría
      stock: 12, // Ejemplo: calcular stock
    };
  }

  // Métodos adicionales específicos del servicio (opcionales)
  async getLowStockProducts(): Promise<ProductView[]> {
    // Lógica específica de productos
  }
}

export const productService = new ProductService();
```

### Métodos heredados automáticamente:

```typescript
// CRUD
await productService.create(data);
await productService.update(id, data);
await productService.delete(id);
await productService.findById(id);

// Paginación y filtros
await productService.getAllView(page, size, searchQuery, dateFrom, dateTo, filter);

// Listeners en tiempo real (si el repositorio lo soporta)
productService.listen$(page, size, searchQuery, dateFrom, dateTo, filter).subscribe(items => {
  console.log('Datos actualizados:', items);
});
```

---

## 📋 Ejemplo Completo

### 1. Definir tipos (Product.ts)

```typescript
import type { IEntity } from "../UtilTypes";

export interface Product extends IEntity {
  code: string;
  name: string;
  category?: string;
  description?: string;
}

export interface ProductView extends Product {
  categoryName?: string;
  stock?: number;
}

export interface CreateProductData {
  code: string;
  name: string;
  category?: string;
  description?: string;
  createdBy: string;
}

export interface UpdateProductData {
  name?: string;
  category?: string;
  description?: string;
  updatedBy?: string;
}

export interface ProductFilter {
  category?: string;
}
```

### 2. Crear servicio (ProductService.ts)

```typescript
import { BaseService } from './BaseService';
import type { Product, ProductView, CreateProductData, UpdateProductData, ProductFilter } from '../types/modelTypes/Product';
import { getProductRepository } from '../db/repositories/product.repository';

class ProductService extends BaseService<Product, ProductView, CreateProductData, UpdateProductData, ProductFilter> {
  constructor() {
    super(getProductRepository());
  }

  protected async toView(entity: Product): Promise<ProductView> {
    return {
      ...entity,
      categoryName: entity.category,
      stock: 12
    };
  }
}

export const productService = new ProductService();
```

### 3. Usar en componente (InventoryPage.tsx)

```typescript
import { useEntityData } from '@/shared/hooks';
import { productService } from '@/shared/services/ProductService';
import type { ProductView, ProductFilter } from '@/shared/types/modelTypes/Product';

export function InventoryPage() {
  const {
    items: products,
    loading,
    error,
    currentPage,
    pageSize,
    totalItems,
    searchQuery,
    filters,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
    clearFilters,
    refresh,
  } = useEntityData<any, ProductView, ProductFilter>(productService, {
    initialPageSize: 20,
  });

  return (
    <div>
      {/* Búsqueda */}
      <input
        value={searchQuery}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar productos..."
      />

      {/* Filtros */}
      <button onClick={() => setFilters({ category: 'electronics' })}>
        Filtrar por Electrónica
      </button>
      <button onClick={clearFilters}>Limpiar</button>

      {/* Tabla */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.code}</td>
                <td>{product.name}</td>
                <td>{product.categoryName}</td>
                <td>{product.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Paginación */}
      <button onClick={() => setPage(currentPage - 1)}>Anterior</button>
      <span>Página {currentPage}</span>
      <button onClick={() => setPage(currentPage + 1)}>Siguiente</button>
    </div>
  );
}
```

---

## ✅ Buenas Prácticas

### 1. **Separación de responsabilidades**
- ❌ No pongas lógica de negocio en componentes
- ✅ Usa servicios para transformaciones y validaciones
- ✅ Los componentes solo renderizan y capturan eventos

### 2. **Tipado estricto**
- ✅ Define interfaces para Entity, View, Create, Update y Filter
- ✅ Usa genéricos en servicios y hooks
- ❌ No uses `any` a menos que sea absolutamente necesario

### 3. **Transformaciones en servicios**
- ✅ Resuelve relaciones en `toView()` (ej: IDs → nombres)
- ✅ Calcula campos derivados en servicios, no en componentes
- ❌ No hagas queries adicionales en componentes

### 4. **Performance**
- ✅ Usa `enableRealtime: true` solo cuando necesites actualizaciones en tiempo real
- ✅ Ajusta `debounceMs` según el caso de uso (búsquedas: 300ms, validaciones: 500ms)
- ✅ Usa paginación para grandes conjuntos de datos

### 5. **Filtros**
- ✅ Define interfaces de filtros específicas para cada entidad
- ✅ Mantén filtros simples y combinables
- ❌ No mezcles filtros con lógica de búsqueda

### 6. **Manejo de errores**
- ✅ Muestra mensajes de error amigables al usuario
- ✅ Usa `refresh()` para reintentar operaciones fallidas
- ✅ Log de errores en consola para debugging

---

## 🚀 Migración de código existente

Si tienes código usando el hook anterior (`useDataTable` o hooks personalizados), puedes migrar así:

### Antes:
```typescript
const { data, loading, setSearch } = useMedicationCatalog();
```

### Después:
```typescript
const { items, loading, setSearch } = useEntityData(productService, {
  initialPageSize: 20,
});
```

### Cambios principales:
- `data.items` → `items`
- `medications` → `items` (nomenclatura genérica)
- Filtros ahora se manejan con `setFilters()` en lugar de propiedades individuales
- Fechas se manejan con `setDateRange()` en lugar de parámetros sueltos

---

## 📞 Soporte

Si tienes dudas o necesitas ayuda:
1. Revisa los ejemplos en `/shared/hooks/useEntityData.example.tsx`
2. Consulta la implementación de `InventoryPage.tsx`
3. Revisa la documentación de RxDB para queries avanzadas

---

**Última actualización**: 22 de octubre de 2025
