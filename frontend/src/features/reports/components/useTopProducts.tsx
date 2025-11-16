import { useMemo } from "react";
import type { Sale } from "@/shared/types/modelTypes/Sale";
import type { TopProductItem } from "./types/Types";

export function useTopProducts(sales: Sale[]) {
  return useMemo(() => {
    if (sales.length === 0) return [];

    const productsMap = new Map<string, TopProductItem>();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (productsMap.has(item.product)) {
          const existing = productsMap.get(item.product)!;
          existing.quantity += item.quantity;
          existing.revenue += item.total;
        } else {
          productsMap.set(item.product, {
            productId: item.product,
            name: item.product,
            quantity: item.quantity,
            revenue: item.total,
          });
        }
      });
    });

    return Array.from(productsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [sales]);
}
