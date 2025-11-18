# Verificación de Stock en Cotizaciones

## Descripción

Sistema profesional para verificar el stock de productos cuando se carga una cotización existente. Detecta automáticamente problemas de disponibilidad y precios, y ofrece al usuario la opción de continuar sin los productos problemáticos o cancelar.

## Arquitectura

### Servicios

#### `QuotationStockVerificationService`

Servicio encargado de verificar el stock de todos los items de una cotización.

**Responsabilidades:**
- Verificar disponibilidad de stock en cada `purchaseBox`
- Detectar cambios de precio desde la creación de la cotización
- Buscar alternativas de stock en otros `purchaseBox` del mismo producto
- Generar reporte detallado de problemas encontrados

**Métodos principales:**

```typescript
async verifyQuotationStock(quotation: SaleView): Promise<StockVerificationResult>
```
Verifica todos los items de una cotización y retorna un resultado con:
- `hasIssues`: boolean indicando si hay problemas
- `issues`: array de problemas encontrados
- `validItems`: items que pueden procesarse normalmente

```typescript
private async verifyItemStock(item: SaleItemView): Promise<StockIssue | null>
```
Verifica un item individual. Retorna `null` si no hay problemas.

```typescript
private async findAlternativePurchaseBox(productId: string, requiredQuantity: number)
```
Busca un `purchaseBox` alternativo con stock suficiente para el mismo producto.

### Tipos de Problemas

#### `StockIssue`

```typescript
interface StockIssue {
  item: SaleItemView;
  issue: 'out_of_stock' | 'insufficient_stock' | 'price_changed';
  currentStock: number;
  requestedQuantity: number;
  alternativePurchaseBox?: {
    purchaseBox: PurchaseView;
    availableStock: number;
    unitPrice: number;
  };
}
```

**Tipos de issues:**
- `out_of_stock`: El producto ya no tiene stock disponible (0 unidades)
- `insufficient_stock`: Hay stock pero menos del requerido
- `price_changed`: El precio ha cambiado desde que se creó la cotización

### Componentes

#### `VerifyStockQuotationModal`

Modal profesional que muestra los problemas de stock detectados.

**Props:**
```typescript
interface VerifyStockQuotationModalProps {
  open: boolean;
  issues: StockIssue[];
  onContinueWithoutIssues: () => void;
  onCancel: () => void;
}
```

**Características:**
- Tabla detallada de productos con problemas
- Badges visuales por tipo de problema
- Información de stock alternativo cuando existe
- Diseño responsive y profesional
- Acciones claras: continuar sin problemas o cancelar

### Integración en `CreateSaleModal`

El flujo de verificación se ejecuta automáticamente al cargar una cotización:

```typescript
useEffect(() => {
  if (initialSaleId && open) {
    const loadQuotation = async () => {
      const saleView = await salesService.findById(initialSaleId);
      
      // Verificar stock
      const verification = await quotationStockVerificationService.verifyQuotationStock(saleView);
      
      if (verification.hasIssues) {
        // Mostrar modal con problemas
        setStockIssues(verification.issues);
        setShowStockVerificationModal(true);
        
        // Cargar solo items válidos
        const validItems = await recreateSaleStateItems(
          { ...saleView, items: verification.validItems },
          currency!
        );
        // ...
      } else {
        // Cargar normalmente
      }
    };
    loadQuotation();
  }
}, [initialSaleId, open, currency]);
```

## Flujo de Usuario

1. Usuario abre una cotización existente
2. Sistema verifica automáticamente el stock de cada producto
3. Si hay problemas:
   - Se muestra modal con tabla de productos problemáticos
   - Cada producto muestra:
     - Stock solicitado vs disponible
     - Tipo de problema (sin stock, insuficiente, precio cambiado)
     - Stock alternativo si existe (solo informativo)
   - Usuario decide:
     - **Continuar**: Se cargan solo los productos válidos
     - **Cancelar**: Se cierra todo y se resetea el estado
4. Si no hay problemas:
   - La cotización se carga normalmente

## Buenas Prácticas Implementadas

### Separación de Responsabilidades
- **Servicio**: Lógica de negocio y verificación
- **Componente**: Presentación y UX
- **Integración**: Orquestación en el componente padre

### Código Limpio
- Nombres descriptivos y consistentes
- Funciones pequeñas con una sola responsabilidad
- Tipado fuerte con TypeScript
- Comentarios JSDoc en métodos públicos

### Manejo de Errores
- Try-catch en operaciones asíncronas
- Fallback a valores seguros en caso de error
- Logs informativos para debugging

### UX Profesional
- Feedback visual claro con badges y colores
- Información completa sin sobrecarga
- Acciones claras y sin ambigüedad
- Diseño responsive

### Performance
- Verificación en paralelo con Promise.all
- Carga lazy del modal
- Memoización de componentes con memo()

### Mantenibilidad
- Tipos exportables y reutilizables
- Configuración centralizada
- Documentación inline
- Estructura modular

## Extensibilidad

El sistema puede extenderse fácilmente para:

1. **Selección de alternativas**: Permitir al usuario elegir el `purchaseBox` alternativo
2. **Actualización automática**: Actualizar precios automáticamente si cambiaron
3. **Notificaciones**: Enviar alertas cuando productos de cotizaciones pierdan stock
4. **Historial**: Registrar qué productos se removieron y por qué
5. **Sugerencias**: Recomendar productos similares si uno no tiene stock

## Testing

Áreas clave para testing:

- Verificación con todos los tipos de issues
- Búsqueda de alternativas
- Manejo de errores en servicios
- Interacciones del usuario en el modal
- Integración completa en CreateSaleModal

## Archivos Modificados/Creados

```
frontend/src/features/sales/
├── services/
│   ├── QuotationStockVerificationService.ts  # Nuevo
│   └── index.ts                               # Nuevo
├── components/
│   ├── VerifyStockQuotationModal.tsx         # Nuevo
│   └── CreateSaleModal.tsx                    # Modificado
└── README_STOCK_VERIFICATION.md               # Este archivo
```
