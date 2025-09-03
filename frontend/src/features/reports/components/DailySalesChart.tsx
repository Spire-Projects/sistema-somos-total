import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Line } from "react-chartjs-2";
import type { DailySales } from "./types/Types";
import { useEffect } from "react";

interface DailySalesChartProps {
  isLoading: boolean;
  hasData: boolean;
  dailySales: DailySales[];
}

export const DailySalesChart = ({
  isLoading,
  hasData,
  dailySales,
}: DailySalesChartProps) => {

  useEffect(() => {
    console.log("Daily Sales:", dailySales);
  }, [dailySales]);

  const chartData = {
    labels: dailySales.map((d) => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: "Total de ventas",
        data: dailySales.map((d) => d.total),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.3,
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de ventas diarias</CardTitle>
        <CardDescription>
          Total de ventas por día en el período seleccionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : !hasData ? (
          <p className="text-gray-500 py-12 text-center">
            No hay datos de ventas en el período seleccionado
          </p>
        ) : (
          <div className="h-[400px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: { mode: "index" },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Ventas ($)",
                    },
                  },
                },
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
