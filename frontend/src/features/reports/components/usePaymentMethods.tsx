import { useMemo } from "react";
import type { Sale } from "@/shared/types/Sales";
import type { PaymentMethodSummary } from "./types/Types";

export function usePaymentMethods(sales: Sale[]) {
  return useMemo(() => {
    if (sales.length === 0) return [];

    const methodMap = new Map<string, { total: number; count: number }>();
    let totalAmount = 0;

    sales.forEach((sale) => {
      totalAmount += sale.total;
      if (methodMap.has(sale.paymentMethod)) {
        const existing = methodMap.get(sale.paymentMethod)!;
        existing.total += sale.total;
        existing.count += 1;
      } else {
        methodMap.set(sale.paymentMethod, {
          total: sale.total,
          count: 1,
        });
      }
    });

    // Traducir nombres de métodos de pago
    const methodNames: Record<string, string> = {
      efectivo: "Efectivo",
      tarjeta: "Tarjeta",
      transferencia: "Transferencia",
    };

    return Array.from(methodMap.entries())
      .map(([method, data]) => ({
        method: methodNames[method as keyof typeof methodNames] || method,
        total: data.total,
        count: data.count,
        percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [sales]);
}
