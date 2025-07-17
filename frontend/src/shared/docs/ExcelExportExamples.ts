// Ejemplo de uso del nuevo sistema de exportación con ExcelJS

import { ExcelExporter } from '@/shared/utils/excel.utils';
import type { ExportConfig, ExportMetadata, ExportFieldConfig } from '@/shared/types/ExportTypes';

// 1. EJEMPLO BÁSICO: Exportar datos simples con estilos

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
  { id: '3', nombre: 'Amoxicilina 500mg', precio: 45.00, stock: 0, categoria: 'Antibióticos' },
];

const camposExportacion: ExportFieldConfig<ProductoEjemplo>[] = [
  { key: 'nombre', label: 'Nombre del Producto', selected: true, width: 30 },
  { key: 'precio', label: 'Precio (€)', selected: true, width: 15, format: (value) => `€${value}` },
  { key: 'stock', label: 'Stock Disponible', selected: true, width: 15 },
  { key: 'categoria', label: 'Categoría', selected: true, width: 20 },
];

export {
  ejemploExportacionBasica,
  ejemploExportacionAvanzada,
  ejemploEstilosPersonalizados,
  formateoHelpers
};
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
      'Estado': 'Activos',
      'Proveedor': 'Todos'
    }
  };

  await ExcelExporter.exportToExcel(
    productosEjemplo, 
    config, 
    metadata, 
    'inventario_productos.xlsx'
  );
}

// 2. EJEMPLO AVANZADO: Con formato de números y fechas

interface VentaEjemplo {
  id: string;
  fecha: Date;
  cliente: string;
  total: number;
  impuestos: number;
  descuento: number;
  estado: 'completada' | 'pendiente' | 'cancelada';
}

const ventasEjemplo: VentaEjemplo[] = [
  {
    id: 'V001',
    fecha: new Date('2024-01-15'),
    cliente: 'Farmacia Central',
    total: 1250.00,
    impuestos: 262.50,
    descuento: 50.00,
    estado: 'completada'
  },
  {
    id: 'V002',
    fecha: new Date('2024-01-16'),
    cliente: 'Clínica San José',
    total: 450.00,
    impuestos: 94.50,
    descuento: 0,
    estado: 'pendiente'
  }
];

const camposVentas: ExportFieldConfig<VentaEjemplo>[] = [
  { 
    key: 'id', 
    label: 'ID Venta', 
    selected: true, 
    width: 12 
  },
  { 
    key: 'fecha', 
    label: 'Fecha', 
    selected: true, 
    width: 15,
    format: (value) => ExcelExporter.formatDate(new Date(value))
  },
  { 
    key: 'cliente', 
    label: 'Cliente', 
    selected: true, 
    width: 25 
  },
  { 
    key: 'total', 
    label: 'Total', 
    selected: true, 
    width: 15,
    format: (value) => ExcelExporter.formatCurrency(Number(value))
  },
  { 
    key: 'impuestos', 
    label: 'Impuestos', 
    selected: true, 
    width: 15,
    format: (value) => ExcelExporter.formatCurrency(Number(value))
  },
  { 
    key: 'descuento', 
    label: 'Descuento', 
    selected: true, 
    width: 15,
    format: (value) => ExcelExporter.formatCurrency(Number(value))
  },
  { 
    key: 'estado', 
    label: 'Estado', 
    selected: true, 
    width: 15,
    format: (value) => {
      const estados = {
        'completada': '✅ Completada',
        'pendiente': '⏳ Pendiente', 
        'cancelada': '❌ Cancelada'
      };
      return estados[value as keyof typeof estados] || value;
    }
  }
];

export async function ejemploExportacionAvanzada() {
  const config: ExportConfig<VentaEjemplo> = {
    title: 'Reporte de Ventas',
    fields: camposVentas,
    dateRange: {
      from: new Date(2024, 0, 1),
      to: new Date()
    },
    includeMetadata: true
  };

  const metadata: ExportMetadata = {
    title: 'Reporte de Ventas - Enero 2024',
    dateRange: {
      from: '01/01/2024',
      to: '31/01/2024'
    },
    totalItems: ventasEjemplo.length,
    exportDate: new Date().toLocaleDateString(),
    exportedBy: 'Administrador',
    filters: {
      'Período': 'Enero 2024',
      'Estado': 'Todas',
      'Región': 'Nacional',
      'Vendedor': 'Todos'
    }
  };

  await ExcelExporter.exportToExcel(
    ventasEjemplo, 
    config, 
    metadata, 
    'reporte_ventas_enero_2024.xlsx'
  );
}

// 3. EJEMPLO: Usando el helper para crear estilos personalizados

export function ejemploEstilosPersonalizados() {
  // Crear estilos profesionales
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

  const estiloExito = ExcelExporter.createCellStyle({
    backgroundColor: 'FF51CF66', // Verde claro
    fontColor: 'FF2B8A3E',       // Verde oscuro
    bold: true,
    alignment: 'right'
  });

  console.log('Estilos creados:', { estiloHeader, estiloAlerta, estiloExito });
  
  return { estiloHeader, estiloAlerta, estiloExito };
}

// 4. FUNCIONES HELPER PARA FORMATEO

export const formateoHelpers = {
  // Formatear moneda española
  formatearEuros: (valor: number) => ExcelExporter.formatCurrency(valor),
  
  // Formatear fecha española
  formatearFecha: (fecha: Date) => ExcelExporter.formatDate(fecha),
  
  // Formatear número con decimales
  formatearNumero: (valor: number, decimales: number = 2) => 
    ExcelExporter.formatNumber(valor, decimales),
  
  // Formatear porcentaje
  formatearPorcentaje: (valor: number) => `${(valor * 100).toFixed(2)}%`,
  
  // Formatear estado con emoji
  formatearEstado: (estado: string) => {
    const emojis = {
      'activo': '✅ Activo',
      'inactivo': '❌ Inactivo',
      'pendiente': '⏳ Pendiente',
      'completado': '✅ Completado',
      'cancelado': '❌ Cancelado',
      'en_proceso': '🔄 En Proceso'
    };
    return emojis[estado as keyof typeof emojis] || estado;
  }
};

// 5. EJEMPLO DE USO EN COMPONENTE REACT

/*
// En tu componente React:

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
*/

export {
  ejemploExportacionBasica,
  ejemploExportacionAvanzada,
  ejemploEstilosPersonalizados,
  formateoHelpers
};
