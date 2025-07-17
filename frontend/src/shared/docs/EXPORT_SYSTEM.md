# Sistema de Exportación a Excel - Documentación

## Descripción

Este sistema proporciona una solución genérica y reutilizable para exportar datos de cualquier tabla a Excel. Incluye un modal configurable para seleccionar rango de fechas, campos a incluir, y genera metadatos automáticamente.

## Características

- ✅ **Genérico**: Funciona con cualquier tipo de datos
- ✅ **Reutilizable**: Un hook y componentes que se pueden usar en múltiples tablas
- ✅ **Configurable**: Selección de campos, formato, rango de fechas
- ✅ **Metadatos**: Incluye información del reporte automáticamente
- ✅ **Filtros de fecha**: Por defecto del primer al último día del mes actual
- ✅ **Formato Excel**: Exporta con múltiples hojas (metadatos + datos)

## Componentes del Sistema

### 1. Tipos (`src/shared/types/ExportTypes.ts`)
```typescript
// Configuración de campo para exportación
interface ExportFieldConfig<T> {
  key: keyof T | string;
  label: string;
  selected: boolean;
  format?: (value: any) => string | number;
  width?: number;
}

// Función extractora de datos
type DataExtractor<T> = (
  dateRange: ExportDateRange,
  selectedFields: string[]
) => Promise<T[]>;
```

### 2. Utilidad de Excel (`src/shared/utils/excel.utils.ts`)
```typescript
// Clase para exportar a Excel con metadatos
export class ExcelExporter {
  static async exportToExcel<T>(
    data: T[],
    config: ExportConfig<T>,
    metadata: ExportMetadata,
    fileName: string
  ): Promise<void>
}
```

### 3. Hook Reutilizable (`src/shared/hooks/useExcelExport.ts`)
```typescript
// Hook que maneja toda la lógica de exportación
export function useExcelExport<T>({
  title,
  dataExtractor,
  defaultFields,
  fileName,
  getAdditionalMetadata
}: UseExcelExportProps<T>): UseExcelExportReturn<T>
```

### 4. Modal de Exportación (`src/shared/components/ExportModal.tsx`)
- Modal reutilizable con:
  - Selector de rango de fechas (por defecto mes actual)
  - Checklist de campos a incluir
  - Opción de incluir metadatos
  - Botón de exportación con estado de carga

## Uso Básico

### 1. Definir el tipo de datos
```typescript
interface MiTipoDeDatos {
  id: string;
  nombre: string;
  fecha: string;
  cantidad: number;
}
```

### 2. Crear función extractora
```typescript
const getMisDatos: DataExtractor<MiTipoDeDatos> = async (dateRange, selectedFields) => {
  // Lógica para obtener datos filtrados por fecha
  const datos = await miServicio.obtenerDatos({
    fechaDesde: dateRange.from,
    fechaHasta: dateRange.to
  });
  
  return datos;
};
```

### 3. Configurar campos de exportación
```typescript
const camposExportacion: ExportFieldConfig<MiTipoDeDatos>[] = [
  { key: 'nombre', label: 'Nombre', selected: true },
  { key: 'fecha', label: 'Fecha', selected: true, format: (value) => new Date(value).toLocaleDateString() },
  { key: 'cantidad', label: 'Cantidad', selected: true },
];
```

### 4. Usar el hook en tu componente
```typescript
export const MiTabla = () => {
  const {
    isExporting,
    isModalOpen,
    openExportModal,
    closeExportModal,
    handleExport
  } = useExcelExport({
    title: 'Mi Reporte',
    dataExtractor: getMisDatos,
    defaultFields: camposExportacion,
    fileName: 'mi_reporte'
  });

  return (
    <div>
      {/* Tu tabla */}
      
      {/* Botón de exportación */}
      <Button onClick={openExportModal}>
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>

      {/* Modal de exportación */}
      <ExportModal<MiTipoDeDatos>
        open={isModalOpen}
        onOpenChange={closeExportModal}
        title="Exportar Mi Reporte"
        fields={camposExportacion}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
};
```

## Ejemplo Completo: Inventario de Medicamentos

```typescript
// En InventoryPage.tsx
const exportFields: ExportFieldConfig<MedicationCatalogView>[] = [
  { key: 'comercialName', label: 'Nombre Comercial', selected: true },
  { key: 'tradeName', label: 'Nombre de Marca', selected: true },
  { key: 'totalActiveStock', label: 'Stock Total', selected: true },
  { key: 'createdAt', label: 'Fecha de Creación', selected: false, 
    format: (value) => new Date(value).toLocaleDateString() },
];

const {
  isExporting,
  isModalOpen,
  openExportModal,
  closeExportModal,
  handleExport
} = useExcelExport({
  title: 'Catálogo de Medicamentos',
  dataExtractor: getMedicationCatalogExport,
  defaultFields: exportFields,
  fileName: 'catalogo_medicamentos',
  getAdditionalMetadata: () => ({
    searchQuery: currentSearchQuery,
    ...currentFilters
  })
});
```

## Personalización Avanzada

### Formateo de Campos
```typescript
const campos = [
  { 
    key: 'precio', 
    label: 'Precio', 
    selected: true,
    format: (value) => `$${value.toFixed(2)}`,
    width: 15
  },
  { 
    key: 'fecha', 
    label: 'Fecha', 
    selected: true,
    format: (value) => new Date(value).toLocaleDateString('es-ES')
  }
];
```

### Metadatos Adicionales
```typescript
const { handleExport } = useExcelExport({
  // ... otras configuraciones
  getAdditionalMetadata: () => ({
    filtroEstado: estadoSeleccionado,
    filtroCategoria: categoriaSeleccionada,
    usuario: usuarioActual.nombre,
    sucursal: sucursalActual.nombre
  })
});
```

## Estructura del Archivo Excel Generado

### Hoja 1: "Información" (Metadatos)
- Título del reporte
- Rango de fechas
- Fecha de exportación
- Usuario que exportó
- Total de elementos
- Filtros aplicados

### Hoja 2: "Datos"
- Datos principales con los campos seleccionados
- Formateado según las configuraciones especificadas

## Dependencias Requeridas

```json
{
  "xlsx": "^0.18.5",
  "file-saver": "^2.0.5",
  "date-fns": "^4.1.0"
}
```

## Instalación de Dependencias

```bash
npm install xlsx file-saver date-fns
npm install --save-dev @types/file-saver
```

## Consideraciones de Rendimiento

- Para datasets grandes (>10,000 registros), considera implementar paginación en el extractor
- El formateo de campos se aplica en memoria, así que evita formateos complejos en datasets grandes
- Los metadatos se generan automáticamente para optimizar la experiencia del usuario

## Extensiones Futuras

- [ ] Soporte para múltiples hojas de datos
- [ ] Exportación a CSV/PDF
- [ ] Plantillas de exportación predefinidas
- [ ] Scheduling de exportaciones automáticas
- [ ] Compresión de archivos grandes

## Solución de Problemas

### Error: "Module not found"
Asegúrate de que todas las dependencias estén instaladas:
```bash
npm install xlsx file-saver date-fns @types/file-saver
```

### Error: "Cannot export large dataset"
Para datasets grandes, implementa paginación en tu función extractora:
```typescript
const getMisDatos: DataExtractor<T> = async (dateRange, selectedFields) => {
  const BATCH_SIZE = 1000;
  let allData = [];
  let page = 1;
  
  while (true) {
    const batch = await miServicio.obtenerDatosPaginados(page, BATCH_SIZE, dateRange);
    if (batch.length === 0) break;
    allData.push(...batch);
    page++;
  }
  
  return allData;
};
```

### Error en tipos TypeScript
Asegúrate de que tu interfaz de datos esté bien definida y que los campos en `ExportFieldConfig` coincidan con las propiedades de tu tipo.
