# Ejemplos de Uso - Sistema de Exportación Excel con ExcelJS

## Ejemplo 1: Exportación Básica

```typescript
import { ExcelExporter } from '@/shared/utils/excel.utils';
import type { ExportConfig, ExportMetadata, ExportFieldConfig } from '@/shared/types/ExportTypes';

interface ProductoEjemplo {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
}

const productosEjemplo: ProductoEjemplo[] = [
  { id: '1', nombre: 'Paracetamol 500mg', precio: 12.50, stock: 5, categoria: 'Analgésicos' },
  { id: '2', nombre: 'Ibuprofeno 400mg', precio: 18.00, stock: 25, categoria: 'Antiinflamatorios' },
];

const camposExportacion: ExportFieldConfig<ProductoEjemplo>[] = [
  { key: 'nombre', label: 'Nombre del Producto', selected: true, width: 30 },
  { key: 'precio', label: 'Precio (€)', selected: true, width: 15, format: (value) => `€${value}` },
  { key: 'stock', label: 'Stock Disponible', selected: true, width: 15 },
  { key: 'categoria', label: 'Categoría', selected: true, width: 20 },
];

async function exportarProductos() {
  const config: ExportConfig<ProductoEjemplo> = {
    title: 'Inventario de Productos',
    fields: camposExportacion,
    dateRange: {
      from: new Date(2024, 0, 1),
      to: new Date()
    },
    includeMetadata: true
  };

  const metadata: ExportMetadata = {
    title: 'Inventario de Productos - Reporte Mensual',
    dateRange: {
      from: '01/01/2024',
      to: new Date().toLocaleDateString()
    },
    totalItems: productosEjemplo.length,
    exportDate: new Date().toLocaleDateString(),
    exportedBy: 'Usuario Demo',
    filters: {
      'Categoría': 'Todas',
      'Estado': 'Activos'
    }
  };

  await ExcelExporter.exportToExcel(
    productosEjemplo, 
    config, 
    metadata, 
    'inventario_productos.xlsx'
  );
}
```

## Ejemplo 2: Usando el Hook useExcelExport

```tsx
import { useExcelExport } from '@/shared/hooks/useExcelExport';
import { ExportModal } from '@/shared/components/ExportModal';

export function MiComponenteConExportacion() {
  const {
    isExporting,
    isModalOpen,
    exportFields,
    openExportModal,
    closeExportModal,
    handleExport
  } = useExcelExport({
    title: 'Mi Reporte',
    dataExtractor: async (dateRange, selectedFields) => {
      // Tu lógica para obtener datos
      return await fetchMisDatos(dateRange, selectedFields);
    },
    defaultFields: misCamposDeExportacion,
    fileName: 'mi_reporte'
  });

  return (
    <div>
      <Button onClick={openExportModal} disabled={isExporting}>
        {isExporting ? 'Exportando...' : 'Exportar a Excel'}
      </Button>
      
      <ExportModal
        open={isModalOpen}
        onOpenChange={closeExportModal}
        title="Mi Reporte"
        fields={exportFields}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
}
```

## Ejemplo 3: Formateo de Datos

```typescript
// Formatear fecha
const formatearFecha = (fecha: Date) => ExcelExporter.formatDate(fecha);

// Formatear moneda
const formatearEuros = (valor: number) => ExcelExporter.formatCurrency(valor);

// Formatear número
const formatearNumero = (valor: number, decimales: number = 2) => 
  ExcelExporter.formatNumber(valor, decimales);

// Uso en campos de exportación
const camposConFormato: ExportFieldConfig<VentaEjemplo>[] = [
  { 
    key: 'fecha', 
    label: 'Fecha', 
    selected: true, 
    width: 15,
    format: (value) => formatearFecha(new Date(value))
  },
  { 
    key: 'total', 
    label: 'Total', 
    selected: true, 
    width: 15,
    format: (value) => formatearEuros(Number(value))
  }
];
```

## Ejemplo 4: Estilos Personalizados

```typescript
// Crear estilos personalizados
const estiloHeader = ExcelExporter.createCellStyle({
  backgroundColor: 'FF2F4F4F', // Verde oscuro
  fontColor: 'FFFFFFFF',       // Blanco
  bold: true,
  fontSize: 12,
  alignment: 'center',
  borderStyle: 'medium'
});

const estiloAlerta = ExcelExporter.createCellStyle({
  backgroundColor: 'FFFF6B6B', // Rojo claro
  fontColor: 'FF721C24',       // Rojo oscuro
  bold: true,
  italic: true,
  alignment: 'center'
});
```

## Características del Excel Generado

✅ **Headers estilizados**: Fondo azul, texto blanco, fuente en negrita
✅ **Bordes**: Bordes completos en todas las celdas
✅ **Filas alternas**: Color de fondo gris claro para mejor legibilidad
✅ **Autofilter**: Filtros automáticos en los headers
✅ **Freeze panes**: Primera fila congelada para navegación
✅ **Formato condicional**: Resaltado automático basado en valores
✅ **Hoja de metadatos**: Información completa del reporte
✅ **Descarga automática**: Archivo se descarga directamente al navegador
