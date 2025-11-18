/**
 * EJEMPLO DE USO DEL SERVICIO DE EXPORTACIÓN A EXCEL
 * 
 * Este archivo muestra cómo usar el ExcelExportService para exportar
 * diferentes tipos de datos a Excel.
 */

import { excelExportService } from './ExcelExportService';
import type { Sale } from '../types/modelTypes/Sale';
import type { Client } from '../types/Client';
import type { DailyCashClosure } from '../types/DailyCashClosure';

// ============================================
// EJEMPLO 1: Exportar ventas
// ============================================
export function exportSalesToExcel(sales: Sale[], userName: string) {
  excelExportService.exportToExcel(sales, {
    title: 'Reporte de Ventas',
    fileName: `ventas_${new Date().toISOString().split('T')[0]}`,
    exportedBy: userName,
    sheetName: 'Ventas',
    // Mapeo personalizado de nombres de columnas
    columnMapping: {
      total: 'Total (Bs)',
      totalWithoutDiscount: 'Total sin Descuento',
      totalDiscount: 'Descuento Total',
      client: 'ID Cliente',
      paymentMethod: 'Método de Pago',
      paymentCurrency: 'Moneda',
      exchangeRateArg: 'Tipo de Cambio ARG',
      factured: 'Facturado',
      nitClient: 'NIT Cliente',
      socialReasonClient: 'Razón Social',
      saleNotes: 'Notas',
      numberInvoice: 'Nº Factura',
      isDraft: 'Borrador',
    },
    // Excluir campos adicionales que no queremos mostrar
    excludeColumns: ['items'], // items es un array complejo, mejor excluirlo
  });
}

// ============================================
// EJEMPLO 2: Exportar clientes
// ============================================
export function exportClientsToExcel(clients: Client[], userName: string) {
  excelExportService.exportToExcel(clients, {
    title: 'Listado de Clientes',
    fileName: `clientes_${new Date().toISOString().split('T')[0]}`,
    exportedBy: userName,
    sheetName: 'Clientes',
    columnMapping: {
      name: 'Nombre',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      address: 'Dirección',
      nit: 'NIT',
      discountPercentage: 'Descuento (%)',
    },
  });
}

// ============================================
// EJEMPLO 3: Exportar arqueos de caja
// ============================================
export function exportCashClosuresToExcel(
  closures: DailyCashClosure[],
  userName: string
) {
  excelExportService.exportToExcel(closures, {
    title: 'Historial de Arqueos de Caja',
    fileName: `arqueos_${new Date().toISOString().split('T')[0]}`,
    exportedBy: userName,
    sheetName: 'Arqueos',
    columnMapping: {
      userId: 'ID Usuario',
      date: 'Fecha',
      openingAmount: 'Monto Apertura',
      closingAmountBs: 'Cierre BS',
      closingAmountArg: 'Cierre ARG',
      notes: 'Notas',
    },
  });
}

// ============================================
// EJEMPLO 4: Uso directo desde un componente
// ============================================
/*
import { excelExportService } from '@/shared/services/ExcelExportService';
import { useAppSelector } from '@/shared/store/hooks';

function MyReportComponent() {
  const { user } = useAppSelector((state) => state.auth);
  const [sales, setSales] = useState<Sale[]>([]);

  const handleExport = () => {
    if (!user) {
      alert('Usuario no autenticado');
      return;
    }

    try {
      excelExportService.exportToExcel(sales, {
        title: 'Reporte de Ventas - Noviembre 2025',
        fileName: 'reporte_ventas_nov_2025',
        exportedBy: user.fullName || user.email,
        sheetName: 'Ventas',
        columnMapping: {
          total: 'Total',
          paymentMethod: 'Método de Pago',
          client: 'Cliente',
        },
        excludeColumns: ['items'],
      });

      alert('Reporte exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el reporte');
    }
  };

  return (
    <button onClick={handleExport}>
      Exportar a Excel
    </button>
  );
}
*/

// ============================================
// EJEMPLO 5: Exportar con filtrado previo
// ============================================
export function exportFilteredSales(
  allSales: Sale[],
  dateFrom: string,
  dateTo: string,
  userName: string
) {
  // Filtrar ventas por rango de fechas
  const filteredSales = allSales.filter((sale) => {
    const saleDate = new Date(sale.createdAt);
    return (
      saleDate >= new Date(dateFrom) &&
      saleDate <= new Date(dateTo)
    );
  });

  excelExportService.exportToExcel(filteredSales, {
    title: `Reporte de Ventas del ${dateFrom} al ${dateTo}`,
    fileName: `ventas_${dateFrom}_${dateTo}`,
    exportedBy: userName,
    sheetName: 'Ventas Filtradas',
    columnMapping: {
      total: 'Total',
      paymentMethod: 'Método de Pago',
      paymentCurrency: 'Moneda',
      numberInvoice: 'Nº Factura',
    },
    excludeColumns: ['items', 'isDraft'],
  });
}
