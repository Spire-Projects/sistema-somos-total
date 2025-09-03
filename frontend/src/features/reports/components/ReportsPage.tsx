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

// Componentes
import { DateRangeFilter } from "./DateRangeFilter";
import { SummaryCards } from "./SummaryCards";
import { ErrorCard } from "./ErrorCard";
import { SalesDebugPanel } from "./SalesDebugPanel";
import { TopProductsChart } from "./TopProductsChart";
import { TopProductsTable } from "./TopProductsTable";
import { DailySalesChart } from "./DailySalesChart";
import { DailySalesTable } from "./DailySalesTable";
import { PaymentMethodChart } from "./PaymentMethodChart";

// Hooks
import { useSalesData } from "./useSalesData";
import { useTopProducts } from "./useTopProducts";
import { useDailySales } from "./useDailySales";
import { usePaymentMethods } from "./usePaymentMethods";
import { useSalesSummary } from "./useSalesSummary";

// Registrar componentes de Chart.js
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

  // Cargar datos
  const { sales, isLoading, error } = useSalesData(dateFrom, dateTo);

  // Procesar datos
  const salesSummary = useSalesSummary(sales);
  const topProducts = useTopProducts(sales);
  const dailySales = useDailySales(sales);
  const paymentMethodSummary = usePaymentMethods(sales);

  // Manejadores de eventos
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
  };

  // Opciones para el filtro
  const filterOptions: FilterOption[] = [
    { value: "products", label: "Productos más vendidos", icon: "📦" },
    { value: "sales", label: "Ventas por día", icon: "📈" },
    { value: "payment", label: "Métodos de pago", icon: "💳" },
  ];

  const [activeFilter, setActiveFilter] = useState<string>("products");
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reportes y Análisis
            </h1>
            <p className="text-gray-500 mt-1">
              Estadísticas de ventas, productos populares y rendimiento del
              negocio
            </p>
          </div>
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded border border-yellow-300 transition-colors"
            title="Mostrar/Ocultar panel de debugging"
          >
            🔍 Debug {showDebugPanel ? 'OFF' : 'ON'}
          </button>
        </div>

        {/* Filtros de fecha */}
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={handleDateFromChange}
          onDateToChange={handleDateToChange}
        />

        {/* Panel de debugging (temporal) */}
        <SalesDebugPanel
          sales={sales}
          dateFrom={dateFrom}
          dateTo={dateTo}
          isVisible={showDebugPanel}
        />

        {/* Tarjetas de resumen */}
        <SummaryCards
          isLoading={isLoading}
          salesSummary={salesSummary}
          dailySales={dailySales}
        />

        {/* Mensajes de error */}
        {error && <ErrorCard message={error} />}

        {/* Gráficos y análisis (reemplazado por FilterTabs) */}
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
