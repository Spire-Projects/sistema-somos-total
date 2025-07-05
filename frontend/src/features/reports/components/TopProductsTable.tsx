import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";
import { formatCurrency } from "@/shared/services/BatchService";
import type { TopProductItem } from "./types/Types";

interface TopProductsTableProps {
  topProducts: TopProductItem[];
}

export const TopProductsTable = ({ topProducts }: TopProductsTableProps) => {
  if (topProducts.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">
          Detalle de productos más vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">Producto</th>
                <th className="text-right py-2 px-2">Cantidad</th>
                <th className="text-right py-2 px-2">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr
                  key={product.medicationId}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="py-2 px-2">{index + 1}</td>
                  <td className="py-2 px-2">{product.name}</td>
                  <td className="py-2 px-2 text-right">{product.quantity}</td>
                  <td className="py-2 px-2 text-right">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
