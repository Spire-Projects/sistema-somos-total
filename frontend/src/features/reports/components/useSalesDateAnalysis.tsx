import { useMemo } from "react";
import type { Sale } from "@/shared/types/Sales";

interface DateAnalysis {
  totalSales: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  salesByDate: Record<string, {
    count: number;
    totalAmount: number;
    sales: Sale[];
  }>;
  timezoneInfo: {
    localTimezone: string;
    offsetMinutes: number;
  };
  potentialIssues: string[];
}

/**
 * Hook para analizar las fechas de las ventas y detectar inconsistencias
 */
export function useSalesDateAnalysis(sales: Sale[]): DateAnalysis {
  return useMemo(() => {
    const analysis: DateAnalysis = {
      totalSales: sales.length,
      dateRange: {
        earliest: "",
        latest: ""
      },
      salesByDate: {},
      timezoneInfo: {
        localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offsetMinutes: new Date().getTimezoneOffset()
      },
      potentialIssues: []
    };

    if (sales.length === 0) {
      return analysis;
    }

    // Procesar cada venta
    sales.forEach(sale => {
      try {
        const saleDate = new Date(sale.createdAt);
        
        // Verificar si la fecha es válida
        if (isNaN(saleDate.getTime())) {
          analysis.potentialIssues.push(`Venta ${sale.id} tiene fecha inválida: ${sale.createdAt}`);
          return;
        }

        // Obtener fecha local (sin hora)
        const localDateString = saleDate.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
        
        // Inicializar el día si no existe
        if (!analysis.salesByDate[localDateString]) {
          analysis.salesByDate[localDateString] = {
            count: 0,
            totalAmount: 0,
            sales: []
          };
        }

        // Agregar la venta al día correspondiente
        analysis.salesByDate[localDateString].count++;
        analysis.salesByDate[localDateString].totalAmount += sale.total;
        analysis.salesByDate[localDateString].sales.push(sale);

      } catch (error) {
        analysis.potentialIssues.push(`Error procesando venta ${sale.id}: ${error}`);
      }
    });

    // Encontrar rango de fechas
    const dates = Object.keys(analysis.salesByDate).sort();
    if (dates.length > 0) {
      analysis.dateRange.earliest = dates[0];
      analysis.dateRange.latest = dates[dates.length - 1];
    }

    // Detectar posibles problemas
    const salesDates = sales.map(s => new Date(s.createdAt));
    const validDates = salesDates.filter(d => !isNaN(d.getTime()));
    
    if (validDates.length !== sales.length) {
      analysis.potentialIssues.push(`${sales.length - validDates.length} ventas tienen fechas inválidas`);
    }

    // Verificar si hay ventas en diferentes zonas horarias
    const timezones = new Set(sales.map(s => {
      try {
        const date = new Date(s.createdAt);
        return date.toISOString().includes('Z') ? 'UTC' : 'Local';
      } catch {
        return 'Invalid';
      }
    }));

    if (timezones.size > 1) {
      analysis.potentialIssues.push(`Ventas almacenadas en diferentes formatos de zona horaria: ${Array.from(timezones).join(', ')}`);
    }

    return analysis;
  }, [sales]);
}

/**
 * Función de utilidad para formatear la fecha en zona horaria local
 */
export function formatDateToLocal(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
}

/**
 * Función para detectar si una fecha está en el rango especificado
 */
export function isDateInRange(dateString: string, fromDate: string, toDate: string): boolean {
  try {
    const date = new Date(dateString);
    const from = new Date(fromDate + 'T00:00:00');
    const to = new Date(toDate + 'T23:59:59.999');
    
    return date >= from && date <= to;
  } catch {
    return false;
  }
}
