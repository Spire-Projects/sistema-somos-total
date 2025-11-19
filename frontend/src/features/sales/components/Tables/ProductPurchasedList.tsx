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
        <table className="w-full text-sm border border-gray-300 rounded-lg bg-white shadow-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-2 px-3 font-bold text-gray-700 border border-gray-300">Producto</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700 border border-gray-300">Lote</th>
              <th className="text-right py-2 px-3 font-bold text-gray-700 border border-gray-300">Cantidad</th>
              <th className="text-right py-2 px-3 font-bold text-gray-700 border border-gray-300">Precio Unit.</th>
              <th className="text-right py-2 px-3 font-bold text-gray-700 border border-gray-300">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2 px-3 border border-gray-300">{item.productName}</td>
                <td className="py-2 px-3 font-mono text-xs border border-gray-300">{item.receiptNumber}</td>
                <td className="py-2 px-3 text-right border border-gray-300">{item.quantity}</td>
                <td className="py-2 px-3 text-right border border-gray-300">{formatCurrency(item.unitPrice, sale.paymentCurrency)}</td>
                <td className="py-2 px-3 text-right font-semibold border border-gray-300">{formatCurrency(item.quantity * item.unitPrice, sale.paymentCurrency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductPurchasedList;
