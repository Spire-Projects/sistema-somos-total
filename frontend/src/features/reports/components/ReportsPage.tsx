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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { BarChart3, LineChart, PieChart } from "lucide-react";

// Componentes
import { DateRangeFilter } from "./DateRangeFilter";
import { SummaryCards } from "./SummaryCards";
import { ErrorCard } from "./ErrorCard";
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
        </div>

        {/* Filtros de fecha */}
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={handleDateFromChange}
          onDateToChange={handleDateToChange}
        />

        {/* Tarjetas de resumen */}
        <SummaryCards
          isLoading={isLoading}
          salesSummary={salesSummary}
          dailySales={dailySales}
        />

        {/* Mensajes de error */}
        {error && <ErrorCard message={error} />}

        {/* Gráficos y análisis */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Productos más vendidos
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Ventas por día
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Métodos de pago
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <TopProductsChart
              isLoading={isLoading}
              hasData={sales.length > 0}
              topProducts={topProducts}
            />

            {!isLoading && <TopProductsTable topProducts={topProducts} />}
          </TabsContent>

          <TabsContent value="sales">
            <DailySalesChart
              isLoading={isLoading}
              hasData={sales.length > 0}
              dailySales={dailySales}
            />

            {!isLoading && <DailySalesTable dailySales={dailySales} />}
          </TabsContent>

          <TabsContent value="payment">
            <PaymentMethodChart
              isLoading={isLoading}
              hasData={sales.length > 0}
              paymentMethodSummary={paymentMethodSummary}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
