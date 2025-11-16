import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FilterTabs } from "@/shared/components/FilterTabs";
import type { FilterOption } from "@/shared/components/FilterTabs";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { SummaryCards } from "../components/SummaryCards";
import { ErrorCard } from "../components/ErrorCard";
import { TopProductsChart } from "../components/TopProductsChart";
import { TopProductsTable } from "../components/TopProductsTable";
import { DailySalesChart } from "../components/DailySalesChart";
import { DailySalesTable } from "../components/DailySalesTable";
import { PaymentMethodChart } from "../components/PaymentMethodChart";
import { useSalesData } from "../components/useSalesData";
import { useTopProducts } from "../components/useTopProducts";
import { useDailySales } from "../components/useDailySales";
import { usePaymentMethods } from "../components/usePaymentMethods";
import { useSalesSummary } from "../components/useSalesSummary";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { sales, isLoading, error } = useSalesData(dateFrom, dateTo);
  const salesSummary = useSalesSummary(sales);
  const topProducts = useTopProducts(sales);
  const dailySales = useDailySales(sales);
  const paymentMethodSummary = usePaymentMethods(sales);

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
  };

  const filterOptions: FilterOption[] = [
    { value: "products", label: "Productos más vendidos", icon: "📦" },
    { value: "sales", label: "Ventas por día", icon: "📈" },
    { value: "payment", label: "Métodos de pago", icon: "💳" },
  ];

  const [activeFilter, setActiveFilter] = useState<string>("products");
 
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto">
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Reportes y Análisis
            </p>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              <span className="inline sm:hidden">Estadísticas y rendimiento</span>
              <span className="hidden sm:inline">
                Estadísticas de ventas, productos populares y rendimiento del negocio
              </span>
            </p>
          </div>
          
        </div>

        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={handleDateFromChange}
          onDateToChange={handleDateToChange}
        />

        <SummaryCards
          isLoading={isLoading}
          salesSummary={salesSummary}
          dailySales={dailySales}
        />

        {error && <ErrorCard message={error} />}

        <div>
          <FilterTabs
            options={filterOptions}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            className="mb-4"
          />

          {activeFilter === "products" && (
            <>
              <TopProductsChart
                isLoading={isLoading}
                hasData={sales.length > 0}
                topProducts={topProducts}
              />

              {!isLoading && <TopProductsTable topProducts={topProducts} />}
            </>
          )}

          {activeFilter === "sales" && (
            <>
              <DailySalesChart
                isLoading={isLoading}
                hasData={sales.length > 0}
                dailySales={dailySales}
              />

              {!isLoading && <DailySalesTable dailySales={dailySales} />}
            </>
          )}

          {activeFilter === "payment" && (
            <PaymentMethodChart
              isLoading={isLoading}
              hasData={sales.length > 0}
              paymentMethodSummary={paymentMethodSummary}
            />
          )}
        </div>
      </div>
    </div>
  );
};
