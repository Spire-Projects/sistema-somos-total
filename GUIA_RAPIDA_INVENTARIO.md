# 🚀 Guía Rápida - Página de Inventario

## Usando el nuevo sistema de Hooks de Productos

La página de inventario ha sido completamente refactorizada para usar el nuevo hook `useProductTable` con soporte de actualizaciones en tiempo real.

---

## 📦 Importar y Usar

### En tu componente:

```tsx
import { useProductTable } from '@/shared/hooks/useProductTable';
import { ProductTable } from '@/features/inventory/components/ProductTable';
import { ProductSearch } from '@/features/inventory/components/ProductSearch';
import { ProductFilters } from '@/features/inventory/components/ProductFilters';

export function MyComponent() {
  const {
    items: products,
    loading,
    error,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchQuery,
    filters,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
    clearFilters,
    refresh,
  } = useProductTable({
    initialPageSize: 20,
    enableRealtime: true,  // ⚡ Actualizaciones en tiempo real
    debounceMs: 300,       // Debounce para búsqueda
  });

  return (
    <div className="space-y-6">
      {/* Búsqueda y Filtros */}
      <div className="flex gap-4">
        <ProductSearch
          value={searchQuery}
          onChange={setSearch}
          disabled={loading}
        />
        <ProductFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          disabled={loading}
        />
      </div>

      {/* Tabla */}
      <ProductTable
        products={products}
        loading={loading}
        onEdit={(product) => console.log('Editar:', product)}
        onDelete={(product) => console.log('Eliminar:', product)}
        onRowClick={(product) => console.log('Click:', product)}
      />
    </div>
  );
}
```

---

## 🎯 Principales Funcionalidades

### 1. **Búsqueda en Tiempo Real**
```tsx
// Buscar por código o nombre
setSearch('laptop');
// Se debouncea automáticamente en 300ms
```

### 2. **Filtros Avanzados**
```tsx
// Aplicar múltiples filtros
setFilters({
  category: 'electrónicos',
  minStock: 10,
  maxPrice: 5000000,
  isLowStock: false,
});

// Limpiar todos los filtros
clearFilters();
```

### 3. **Paginación**
```tsx
// Cambiar página
setPage(2);

// Cambiar cantidad de items por página
setPageSize(50);
```

### 4. **Actualizar Datos**
```tsx
// Refrescar manualmente
await refresh();
```

---

## 💡 Indicadores de Stock

| Estado | Condición | Color |
|--------|-----------|-------|
| **Agotado** | stock = 0 | 🔴 Rojo |
| **Bajo** | stock < 10 | 🟡 Amarillo |
| **Normal** | stock < 50 | 🔵 Azul |
| **Óptimo** | stock ≥ 50 | 🟢 Verde |

---

## 🔄 Actualizaciones en Tiempo Real

El hook tiene soporte para actualizaciones en tiempo real mediante RxDB Observables:

```tsx
const hook = useProductTable({
  enableRealtime: true,  // ✅ Habilitado por defecto
});

// Los productos se actualizan automáticamente cuando cambien en la BD
```

---

## 🎨 Componentes Incluidos

### **ProductTable**
- Tabla profesional con todas las columnas de producto
- Indicadores visuales de stock
- Menú de acciones (Editar, Eliminar)
- Skeletons de carga
- Empty state

### **ProductSearch**
- Búsqueda por código o nombre
- Botón para limpiar
- Debounce automático

### **ProductFilters**
- Filtros por categoría
- Rango de stock
- Rango de precio
- Estado del producto
- Badge con contador de filtros activos

---

## 📊 Integración con Servicios

El hook usa automáticamente los siguientes servicios:

- **ProductService** - Lógica de negocio
- **ProductRepository** - Acceso a datos con RxDB
- **Product model** - Tipos de datos

---

## ✅ Métodos Adicionales del Hook

```tsx
const {
  // Datos
  items,
  loading,
  error,
  
  // Paginación
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  
  // Búsqueda y Filtros
  searchQuery,
  filters,
  sort,
  
  // Acciones
  setPage,
  setPageSize,
  setSearch,
  setFilters,
  setSort,
  clearFilters,
  refresh,
} = useProductTable();
```

---

## 🔗 Importaciones Necesarias

```tsx
// Hook
import { useProductTable } from '@/shared/hooks/useProductTable';

// Componentes
import { ProductTable } from '@/features/inventory/components/ProductTable';
import { ProductSearch } from '@/features/inventory/components/ProductSearch';
import { ProductFilters } from '@/features/inventory/components/ProductFilters';

// Tipos
import type { Product } from '@/shared/types/modelTypes/Product';
import type { ProductFilters } from '@/shared/hooks/useProductTable';
```

---

## 🚨 Manejo de Errores

```tsx
if (error) {
  if (error.includes('Inicializando base de datos')) {
    return <LoadingState message={error} />;
  }
  return <ErrorState error={error} onRetry={refresh} />;
}
```

---

## 📝 Ejemplo Completo

Ver: `/frontend/src/features/inventory/components/InventoryPage.tsx`

---

## 🎯 Próximos Pasos

Los TODOs pendientes:

1. Implementar modal de edición
2. Implementar modal de confirmación de eliminación
3. Implementar modal de detalles del producto
4. Implementar exportación a Excel

---

## 📚 Documentación Completa

Para más detalles: `/IMPLEMENTACION_INVENTARIO.md`

---

✨ **¡Listo para usar!** ✨
