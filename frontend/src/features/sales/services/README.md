# Servicio de Generación de PDFs de Cotización

## Descripción

El `QuotationPdfService` es un servicio que se encarga de generar PDFs profesionales de cotizaciones de ventas. Utiliza `jsPDF` y `jspdf-autotable` para crear documentos con formato profesional.

## Características

- ✅ Generación de PDFs con formato profesional
- ✅ Tabla de productos con detalles completos
- ✅ Cálculo automático de subtotales y totales
- ✅ Soporte para descuentos
- ✅ Información del cliente y NIT
- ✅ Notas adicionales
- ✅ Footer informativo

## Uso

### Desde el Hook

```typescript
import { useQuotationPdf } from '@/features/sales/hooks';

const { generatePdf, downloadPdf, printPdf } = useQuotationPdf({
  saleState: currentSaleState,
  quotationNumber: 'COTIZ-001',
});

// Descargar PDF
await downloadPdf();

// Imprimir PDF
await printPdf();

// Generar y obtener Blob
const blob = await generatePdf();
```

### Uso Directo del Servicio

```typescript
import { QuotationPdfService } from '@/features/sales/services/QuotationPdfService';

const doc = QuotationPdfService.generateQuotationPdf({
  saleState: myS aleState,
  quotationNumber: 'COTIZ-001',
});

// Descargar
doc.save('cotizacion.pdf');

// Obtener blob
const blob = doc.output('blob');
```

## Estructura del PDF

1. **Header**: Logo/nombre de empresa y título
2. **Información de cotización**: Número, fecha, moneda
3. **Datos del cliente**: Nombre, NIT, razón social
4. **Tabla de productos**: Con columnas para cantidad, precio, descuento y total
5. **Resumen de totales**: Subtotal, descuentos y total
6. **Notas**: Si existen
7. **Footer**: Información legal

## Personalización

Los colores y estilos se pueden modificar en la constante `COLORS` del servicio:

```typescript
private static readonly COLORS = {
  primary: '#2563eb',    // Color principal
  secondary: '#64748b',  // Color secundario
  text: '#1e293b',       // Color de texto
  lightGray: '#f1f5f9',  // Gris claro para fondos
};
```

## Componentes Relacionados

- **QuotationPreviewModal**: Modal para vista previa del PDF
- **useQuotationPdf**: Hook para facilitar el uso del servicio
- **CreateSaleModal**: Implementación en el flujo de ventas
