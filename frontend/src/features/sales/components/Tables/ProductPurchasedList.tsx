import type { SaleView } from "@/shared/types/modelTypes/Sale";
import { formatCurrency } from "../../utils/SaleUtils";

interface ProductPurchasedListProps {
  sale: SaleView;
}

const ProductPurchasedList = ({ sale }: ProductPurchasedListProps) => {
  return (
    <div>
      <div className="font-semibold text-sm text-gray-700 mb-2">
        Productos vendidos ({sale.items.length})
      </div>
      {/* Tabla de items */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium text-gray-600">
                Producto
              </th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">
                Lote
              </th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">
                Cantidad
              </th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">
                Precio Unit.
              </th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.productName}</td>
                <td className="py-2 px-3 font-mono text-xs">
                  {item.receiptNumber}
                </td>
                <td className="py-2 px-3 text-right">{item.quantity}</td>
                <td className="py-2 px-3 text-right">
                  {formatCurrency(item.unitPrice, sale.paymentCurrency)}
                </td>
                
                <td className="py-2 px-3 text-right font-semibold">
                  {formatCurrency(item.quantity * item.unitPrice, sale.paymentCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductPurchasedList;
