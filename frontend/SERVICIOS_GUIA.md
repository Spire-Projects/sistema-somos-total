# Servicios - Guía de Uso

Esta guía documenta el uso de los servicios para **Products**, **Sales** y **Purchases**, que implementan lógica de negocio sobre los repositorios.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [BaseService](#baseservice)
- [ProductService](#productservice)
- [SaleService](#saleservice)
- [PurchaseService](#purchaseservice)
- [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🏗️ Arquitectura

```
┌─────────────────────┐
│   React Component   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Service Layer     │  ◄── Lógica de Negocio
│  - ProductService   │      - Validaciones
│  - SaleService      │      - Cálculos
│  - PurchaseService  │      - Orquestación
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Repository Layer   │  ◄── Acceso a Datos
│  - CRUD operations  │      - Queries optimizadas
│  - Live listeners   │      - Paginación
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   RxDB Database     │
└─────────────────────┘
```

### Responsabilidades

- **Services**: Lógica de negocio, validaciones, orquestación entre entidades
- **Repositories**: Acceso a datos, queries optimizadas, listeners en tiempo real
- **Database**: Persistencia y sincronización

---

## 🎯 BaseService

El `BaseService` es una clase genérica que proporciona operaciones CRUD comunes para todas las entidades.

### Métodos Heredados

Todos los servicios heredan estos métodos:

```typescript
// CRUD Básico
await service.create(data)
await service.findById(id)
await service.findAll()
await service.findAllPaginated(page, size, searchQuery?)
await service.update(id, data)
await service.delete(id)

// Soft Delete
await service.softDelete(id, deletedBy)
await service.restore(id)

// Consultas
await service.getActive()
await service.getDeleted()
await service.getStatistics()

// Listeners en tiempo real
service.findAllLive$()
service.findAllPaginatedLive$(page, size, searchQuery?)
```

---

## 🛍️ ProductService

Servicio para gestión de productos con manejo de inventario.

### Uso Básico

```typescript
import { ProductService } from '@/shared/services/ProductService';

// Crear producto con validaciones
const result = await ProductService.createProduct({
  code: 'PROD-001',
  name: 'Laptop Dell',
  category: 'Electrónica',
  stock: 50,
  unitCost: 500,
  unitPrice: 800,
  createdBy: 'user-123'
});

if (result.success) {
  console.log('Producto creado:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Métodos Específicos

#### 1. Buscar por código

```typescript
const result = await ProductService.findByCode('PROD-001');
```

#### 2. Listener en tiempo real de un producto

```typescript
const subscription = ProductService.findByCodeLive$('PROD-001').subscribe(
  (product) => {
    if (product) {
      console.log('Stock actualizado:', product.stock);
    }
  }
);

// Desuscribirse
subscription.unsubscribe();
```

#### 3. Productos por categoría

```typescript
const result = await ProductService.getProductsByCategory('Electrónica');
```

#### 4. Productos con stock bajo

```typescript
const result = await ProductService.getLowStockProducts(10); // threshold: 10
```

#### 5. Actualizar stock

```typescript
// Sumar stock
await ProductService.updateStock('PROD-001', 20, 'add');

// Restar stock
await ProductService.updateStock('PROD-001', 5, 'subtract');
```

#### 6. Validar disponibilidad

```typescript
const validation = await ProductService.validateStock('PROD-001', 10);

if (validation.success && validation.available) {
  console.log('Stock suficiente');
} else {
  console.log('Stock insuficiente. Disponible:', validation.currentStock);
}
```

#### 7. Búsqueda avanzada

```typescript
const result = await ProductService.searchProducts({
  name: 'laptop',
  category: 'Electrónica',
  minStock: 10,
  maxStock: 100
});
```

---

## 💰 SaleService

Servicio para gestión de ventas con validación automática de stock.

### Uso Básico

```typescript
import { SaleService } from '@/shared/services/SaleService';

// Crear venta (valida stock y actualiza automáticamente)
const result = await SaleService.createSale({
  date: new Date().toISOString(),
  productCode: 'PROD-001',
  quantity: 5,
  client: 'Juan Pérez',
  comprobante: 'FAC-001',
  createdBy: 'user-123'
});

if (result.success) {
  console.log('Venta creada y stock actualizado:', result.data);
} else {
  console.error('Error:', result.error); // "Stock insuficiente..."
}
```

### Métodos Específicos

#### 1. Ventas por producto

```typescript
const result = await SaleService.getSalesByProduct('PROD-001');
```

#### 2. Ventas por cliente

```typescript
const result = await SaleService.getSalesByClient('Juan Pérez');
```

#### 3. Ventas por rango de fechas

```typescript
const result = await SaleService.getSalesByDateRange(
  '2025-01-01T00:00:00',
  '2025-12-31T23:59:59'
);
```

#### 4. Total de ventas del día

```typescript
const result = await SaleService.getDailySalesTotal(); // Hoy
// O especificar fecha
const result2 = await SaleService.getDailySalesTotal('2025-01-15');

console.log('Total:', result.total);
console.log('Cantidad de ventas:', result.count);
```

#### 5. Cancelar venta (restaura stock)

```typescript
const result = await SaleService.cancelSale('sale-id', 'user-123');

if (result.success) {
  console.log('Venta cancelada y stock restaurado');
}
```

#### 6. Productos más vendidos

```typescript
const result = await SaleService.getTopSellingProducts(10);

result.data?.forEach(product => {
  console.log(`${product.productCode}: ${product.totalSold} unidades`);
  console.log(`Ingresos: $${product.revenue}`);
});
```

#### 7. Ventas del mes actual

```typescript
const result = await SaleService.getCurrentMonthSales();

console.log('Ventas del mes:', result.data?.length);
console.log('Total facturado:', result.total);
```

---

## 📦 PurchaseService

Servicio para gestión de compras con actualización automática de stock e inventario.

### Uso Básico

```typescript
import { PurchaseService } from '@/shared/services/PurchaseService';

// Crear compra (actualiza stock automáticamente)
const result = await PurchaseService.createPurchase({
  date: new Date().toISOString(),
  productCode: 'PROD-001',
  quantity: 50,
  unitCost: 450,
  supplier: 'Proveedor XYZ',
  comprobante: 'COMP-001',
  createdBy: 'user-123'
});

if (result.success) {
  console.log('Compra creada y stock actualizado:', result.data);
}
```

### Métodos Específicos

#### 1. Compras por producto

```typescript
const result = await PurchaseService.getPurchasesByProduct('PROD-001');
```

#### 2. Compras por proveedor

```typescript
const result = await PurchaseService.getPurchasesBySupplier('Proveedor XYZ');
```

#### 3. Compras por rango de fechas

```typescript
const result = await PurchaseService.getPurchasesByDateRange(
  '2025-01-01T00:00:00',
  '2025-12-31T23:59:59'
);
```

#### 4. Total de compras del día

```typescript
const result = await PurchaseService.getDailyPurchasesTotal();

console.log('Total gastado:', result.total);
console.log('Número de compras:', result.count);
```

#### 5. Cancelar compra (ajusta stock)

```typescript
const result = await PurchaseService.cancelPurchase('purchase-id', 'user-123');

if (result.success) {
  console.log('Compra cancelada y stock ajustado');
}
```

#### 6. Proveedores principales

```typescript
const result = await PurchaseService.getTopSuppliers(10);

result.data?.forEach(supplier => {
  console.log(`${supplier.supplier}: ${supplier.totalPurchases} compras`);
  console.log(`Total gastado: $${supplier.totalSpent}`);
});
```

#### 7. Costo promedio de compra

```typescript
const result = await PurchaseService.getAveragePurchaseCost('PROD-001');

console.log('Costo promedio:', result.averageCost);
console.log('Total de compras:', result.totalPurchases);
```

#### 8. Compras del mes actual

```typescript
const result = await PurchaseService.getCurrentMonthPurchases();

console.log('Compras del mes:', result.data?.length);
console.log('Total gastado:', result.total);
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Flujo completo de venta

```typescript
import { SaleService } from '@/shared/services/SaleService';
import { ProductService } from '@/shared/services/ProductService';

async function processSale(productCode: string, quantity: number, userId: string) {
  // 1. Verificar disponibilidad
  const stockCheck = await ProductService.validateStock(productCode, quantity);
  
  if (!stockCheck.success || !stockCheck.available) {
    return {
      success: false,
      error: `Stock insuficiente. Disponible: ${stockCheck.currentStock}`
    };
  }

  // 2. Obtener producto para calcular precio
  const productResult = await ProductService.findByCode(productCode);
  if (!productResult.success) {
    return { success: false, error: 'Producto no encontrado' };
  }

  const product = productResult.data!;
  const unitPrice = product.unitPrice || 0;
  const totalPrice = unitPrice * quantity;

  // 3. Crear la venta (actualiza stock automáticamente)
  const saleResult = await SaleService.createSale({
    date: new Date().toISOString(),
    productCode,
    quantity,
    unitPrice,
    totalPrice,
    client: 'Cliente General',
    comprobante: `FAC-${Date.now()}`,
    createdBy: userId
  });

  return saleResult;
}
```

### Ejemplo 2: Flujo completo de compra

```typescript
import { PurchaseService } from '@/shared/services/PurchaseService';

async function processPurchase(
  productCode: string,
  quantity: number,
  unitCost: number,
  supplier: string,
  userId: string
) {
  // Crear compra (actualiza stock y costo del producto automáticamente)
  const purchaseResult = await PurchaseService.createPurchase({
    date: new Date().toISOString(),
    productCode,
    quantity,
    unitCost,
    totalCost: unitCost * quantity,
    supplier,
    comprobante: `COMP-${Date.now()}`,
    createdBy: userId
  });

  if (purchaseResult.success) {
    console.log('✅ Compra registrada');
    console.log(`📦 Stock actualizado: +${quantity} unidades`);
    console.log(`💰 Nuevo costo unitario: $${unitCost}`);
  }

  return purchaseResult;
}
```

### Ejemplo 3: Dashboard con listeners en tiempo real

```typescript
import { useEffect, useState } from 'react';
import { ProductService } from '@/shared/services/ProductService';
import { SaleService } from '@/shared/services/SaleService';

function Dashboard() {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [dailySales, setDailySales] = useState(0);

  useEffect(() => {
    // Listener para productos con stock bajo
    const productSub = ProductService.findAllLive$().subscribe(products => {
      const lowStock = products.filter(p => (p.stock || 0) < 10);
      setLowStockCount(lowStock.length);
    });

    // Listener para ventas (actualiza total del día)
    const salesSub = SaleService.findAllLive$().subscribe(async sales => {
      const result = await SaleService.getDailySalesTotal();
      if (result.success) {
        setDailySales(result.total || 0);
      }
    });

    return () => {
      productSub.unsubscribe();
      salesSub.unsubscribe();
    };
  }, []);

  return (
    <div>
      <h2>Dashboard en Tiempo Real</h2>
      <div>⚠️ Productos con stock bajo: {lowStockCount}</div>
      <div>💰 Ventas del día: ${dailySales.toFixed(2)}</div>
    </div>
  );
}
```

### Ejemplo 4: Reportes y estadísticas

```typescript
import { ProductService } from '@/shared/services/ProductService';
import { SaleService } from '@/shared/services/SaleService';
import { PurchaseService } from '@/shared/services/PurchaseService';

async function generateMonthlyReport() {
  // Estadísticas de productos
  const productStats = await ProductService.getProductStatistics();
  
  // Estadísticas de ventas
  const saleStats = await SaleService.getSalesStatistics();
  
  // Estadísticas de compras
  const purchaseStats = await PurchaseService.getPurchaseStatistics();
  
  // Top productos vendidos
  const topProducts = await SaleService.getTopSellingProducts(5);
  
  // Top proveedores
  const topSuppliers = await PurchaseService.getTopSuppliers(5);

  return {
    products: {
      total: productStats.data?.totalProducts,
      lowStock: productStats.data?.lowStockProducts
    },
    sales: {
      total: saleStats.data?.totalRevenueGenerated,
      count: saleStats.data?.activeSales,
      topProducts: topProducts.data
    },
    purchases: {
      total: purchaseStats.data?.totalCostPurchased,
      count: purchaseStats.data?.activePurchases,
      topSuppliers: topSuppliers.data
    }
  };
}
```

---

## 🎯 Mejores Prácticas

### 1. Validaciones de Negocio

Los servicios ya incluyen validaciones, pero puedes agregar más según tu caso:

```typescript
if (quantity > 1000) {
  return { success: false, error: 'Cantidad máxima excedida' };
}
```

### 2. Manejo de Errores

Siempre verifica el resultado:

```typescript
const result = await ProductService.updateStock('PROD-001', 10, 'add');

if (!result.success) {
  // Mostrar error al usuario
  toast.error(result.error);
  return;
}

// Continuar con éxito
toast.success('Stock actualizado');
```

### 3. Transacciones Lógicas

Para operaciones que afectan múltiples entidades, usa try-catch:

```typescript
async function transferStock(fromProduct: string, toProduct: string, qty: number) {
  try {
    await ProductService.updateStock(fromProduct, qty, 'subtract');
    await ProductService.updateStock(toProduct, qty, 'add');
    return { success: true };
  } catch (error) {
    // Revertir cambios si algo falla
    return { success: false, error: 'Error en transferencia' };
  }
}
```

### 4. Uso de Listeners

Los listeners consumen recursos. Úsalos solo cuando necesites datos en tiempo real:

```typescript
// ✅ BIEN: Dashboard que necesita datos actualizados
const subscription = ProductService.findAllLive$().subscribe(...);

// ❌ MAL: Páginas estáticas o consultas únicas
// Mejor usar await ProductService.findAll()
```

---

## 📁 Ubicación de Archivos

```
frontend/src/shared/services/
├── BaseService.ts          # Servicio base genérico
├── ProductService.ts       # Servicio de productos
├── SaleService.ts          # Servicio de ventas
└── PurchaseService.ts      # Servicio de compras
```

---

**¡Listo!** Ya tienes servicios completos con lógica de negocio, validaciones y operaciones automáticas. 🎉
