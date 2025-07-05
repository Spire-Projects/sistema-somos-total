import { useMemo } from "react";
import type { Sale } from "@/shared/types/Sales";
import type { DailySales } from "./types/Types";

export function useDailySales(sales: Sale[]) {
  return useMemo(() => {
    if (sales.length === 0) return [];

    const salesByDay = new Map<string, DailySales>();

    sales.forEach((sale) => {
      const date = sale.createdAt.split("T")[0];
      if (salesByDay.has(date)) {
        const existing = salesByDay.get(date)!;
        existing.total += sale.total;
        existing.count += 1;
      } else {
        salesByDay.set(date, {
          date,
          total: sale.total,
          count: 1,
        });
      }
    });

    return Array.from(salesByDay.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [sales]);
}
