import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatCurrency } from "@/shared/services/BatchService";
import type { DailySales, SalesSummary } from "./types/Types";

interface SummaryCardsProps {
  isLoading: boolean;
  salesSummary: SalesSummary;
  dailySales: DailySales[];
}

export const SummaryCards = ({
  isLoading,
  salesSummary,
  dailySales,
}: SummaryCardsProps) => {
  const avgDailyBs = dailySales.length > 0 
    ? salesSummary.totalBs / dailySales.length 
    : 0;
  const avgDailyArg = dailySales.length > 0 
    ? salesSummary.totalArg / dailySales.length 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">
            Ventas Totales BS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(salesSummary.totalBs)} Bs
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {salesSummary.count} ventas totales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">
            Ventas Totales ARG
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(salesSummary.totalArg)} ARS
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            En pesos argentinos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">
            Promedio por Venta BS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(salesSummary.averageBs)} Bs
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Por transacción</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">
            Promedio Diario BS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(avgDailyBs)} Bs
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Promedio por día</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">
            Promedio Diario ARG
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(avgDailyArg)} ARS
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Promedio por día</p>
        </CardContent>
      </Card>
    </div>
  );
};
