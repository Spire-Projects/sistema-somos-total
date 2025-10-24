import { useMemo } from "react";
import type { Sale } from "@/shared/types/modelTypes/Sale";
import type { TopProductItem } from "./types/Types";

export function useTopProducts(sales: Sale[]) {
  return useMemo(() => {
    if (sales.length === 0) return [];

    const productsMap = new Map<string, TopProductItem>();

    // Recopilar todos los productos vendidos
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (productsMap.has(item.medicationId)) {
          const existing = productsMap.get(item.medicationId)!;
          existing.quantity += item.quantity;
          existing.revenue += item.total;
        } else {
          productsMap.set(item.medicationId, {
            medicationId: item.medicationId,
            name: item.medicationId,
            quantity: item.quantity,
            revenue: item.total,
          });
        }
      });
    });

    // Convertir a array y ordenar por cantidad
    return Array.from(productsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [sales]);
}
