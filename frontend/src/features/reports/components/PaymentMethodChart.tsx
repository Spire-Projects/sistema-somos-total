import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Pie } from "react-chartjs-2";
import { formatCurrency } from "@/shared/services/BatchService";
import type { PaymentMethodSummary } from "./types/Types";

interface PaymentMethodChartProps {
  isLoading: boolean;
  hasData: boolean;
  paymentMethodSummary: PaymentMethodSummary[];
}

export const PaymentMethodChart = ({ isLoading, hasData, paymentMethodSummary }: PaymentMethodChartProps) => {
  const chartData = {
    labels: paymentMethodSummary.map(p => p.method),
    datasets: [
      {
        label: 'Método de pago',
        data: paymentMethodSummary.map(p => p.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por métodos de pago</CardTitle>
        <CardDescription>
          Análisis de ventas por método de pago
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="w-full h-[300px] flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData ? (
            <p className="text-gray-500 py-12 text-center">No hay datos de ventas en el período seleccionado</p>
          ) : (
            <>
              <div className="h-[300px]">
                <Pie 
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const value = context.raw as number;
                            const total = context.chart.getDatasetMeta(0).total || 0;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `${formatCurrency(value)} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="space-y-4">
                  {paymentMethodSummary.map((method) => (
                    <div key={method.method} className="flex items-center">
                      <div className="w-3/5">
                        <div className="text-sm font-medium">{method.method}</div>
                        <div className="text-xs text-gray-500">{method.count} transacciones</div>
                      </div>
                      <div className="w-2/5 text-right">
                        <div className="text-sm font-medium">{formatCurrency(method.total)}</div>
                        <div className="text-xs text-gray-500">{method.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};