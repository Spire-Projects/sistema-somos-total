import { useMemo } from "react";
import type { Sale } from "@/shared/types/Sales";

export function useSalesSummary(sales: Sale[]) {
  return useMemo(() => {
    if (sales.length === 0) return { total: 0, count: 0, average: 0 };

    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    return {
      total,
      count: sales.length,
      average: total / sales.length,
    };
  }, [sales]);
}
