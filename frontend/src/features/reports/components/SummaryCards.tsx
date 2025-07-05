import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatCurrency } from "@/shared/services/BatchService";
import type { DailySales } from "./types/Types";

interface SummaryCardsProps {
  isLoading: boolean;
  salesSummary: {
    total: number;
    count: number;
    average: number;
  };
  dailySales: DailySales[];
}

export const SummaryCards = ({ isLoading, salesSummary, dailySales }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Ventas Totales</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(salesSummary.total)}</div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {salesSummary.count} ventas en el período
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Venta Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(salesSummary.average)}</div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Por transacción
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Ventas por día</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(dailySales.length > 0 
                ? salesSummary.total / dailySales.length 
                : 0)}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Promedio diario
          </p>
        </CardContent>
      </Card>
    </div>
  );
};