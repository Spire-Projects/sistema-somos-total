import { useState, useEffect } from "react";
import { findSalesByDateRange } from "@/shared/services/SalesService";
import type { Sale } from "@/shared/types/Sales";

export function useSalesData(dateFrom: string, dateTo: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSales = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Asegurar formato completo ISO para ambas fechas
        const dateFromFormatted = dateFrom + "T00:00:00.000Z";
        const dateToFormatted = dateTo + "T23:59:59.999Z";
        const salesData = await findSalesByDateRange(
          dateFromFormatted,
          dateToFormatted
        );
        setSales(salesData);
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
