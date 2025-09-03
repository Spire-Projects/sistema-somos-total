import { useState, useEffect } from "react";
import { findSalesByDateRange } from "@/shared/services/SalesService";
import type { Sale } from "@/shared/types/Sales";

/**
 * Hook mejorado para cargar datos de ventas con manejo robusto de fechas
 * Asegura que se incluyan todas las ventas del rango especificado
 */
export function useSalesDataV2(dateFrom: string, dateTo: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSales = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Convertir fechas a objetos Date locales
        const fromDate = new Date(dateFrom + "T00:00:00");
        const toDate = new Date(dateTo + "T23:59:59.999");
        
        // Convertir a ISO strings manteniendo la zona horaria local
        const dateFromFormatted = fromDate.toISOString();
        const dateToFormatted = toDate.toISOString();
        
        console.log("🔍 Cargando ventas (V2):", { 
          fechaOriginal: { from: dateFrom, to: dateTo },
          fechaLocal: { from: fromDate, to: toDate },
          fechaISO: { from: dateFromFormatted, to: dateToFormatted }
        });
        
        const salesData = await findSalesByDateRange(
          dateFromFormatted,
          dateToFormatted
        );
        
        // Filtrado adicional del lado cliente para asegurar exactitud
        const filteredSales = salesData.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          const saleLocalDate = new Date(saleDate.getTime() - (saleDate.getTimezoneOffset() * 60000));
          const saleDateString = saleLocalDate.toISOString().split('T')[0];
          
          return saleDateString >= dateFrom && saleDateString <= dateTo;
        });
        
        console.log("📊 Ventas procesadas (V2):", {
          totalOriginal: salesData.length,
          totalFiltrado: filteredSales.length,
          fechaInicio: dateFromFormatted,
          fechaFin: dateToFormatted,
          ventasExcluidas: salesData.length - filteredSales.length
        });
        
        setSales(filteredSales);
      } catch (err) {
        console.error("Error al cargar ventas:", err);
        setError("Error al cargar los datos de ventas");
      } finally {
        setIsLoading(false);
      }
    };

    // Solo cargar si tenemos fechas válidas
    if (dateFrom && dateTo) {
      loadSales();
    }
  }, [dateFrom, dateTo]);

  return { sales, isLoading, error };
}
