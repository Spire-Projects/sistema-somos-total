import { memo } from 'react';
import { formatCurrency } from '@/shared/services/BatchService';
import { formatDate } from '@/shared/utils/date.utils';
import type { Sale } from '@/shared/types/Sales';

interface SaleDetailsProps {
  sale: Sale;
}

const SaleDetails = memo(({ sale }: SaleDetailsProps) => {
  return (
    <div className="bg-gray-50 p-4 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Información general */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-900">Información General</h4>
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-600">ID:</span>
              <span className="ml-1 font-mono text-gray-900">{sale.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Fecha:</span>
              <span className="ml-1">{formatDate(sale.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-600">Método de pago:</span>
              <span className="ml-1 capitalize">{sale.paymentMethod}</span>
            </div>
            <div>
              <span className="text-gray-600">Creado por:</span>
              <span className="ml-1">{sale.createdBy}</span>
            </div>
          </div>
        </div>

        {/* Cliente y médico */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-900">Cliente y Médico</h4>
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-600">Cliente:</span>
              <span className="ml-1">{sale.client || 'Cliente general'}</span>
            </div>
            <div>
              <span className="text-gray-600">Médico:</span>
              <span className="ml-1">{sale.idMedic || 'Sin médico asignado'}</span>
            </div>
            <div>
              <span className="text-gray-600">Facturado:</span>
              <span className={`ml-1 ${sale.factured ? 'text-green-600' : 'text-orange-600'}`}>
                {sale.factured ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Totales */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-900">Totales</h4>
          <div className="space-y-1 text-xs">
            {sale.totalWithoutDiscount && (
              <div>
                <span className="text-gray-600">Subtotal:</span>
                <span className="ml-1">{formatCurrency(sale.totalWithoutDiscount)}</span>
              </div>
            )}
            {sale.totalDiscount && sale.totalDiscount > 0 && (
              <div>
                <span className="text-gray-600">Descuento:</span>
                <span className="ml-1 text-red-600">-{formatCurrency(sale.totalDiscount)}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600 font-semibold">Total:</span>
              <span className="ml-1 font-semibold text-green-600">{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items de la venta */}
      <div>
        <h4 className="font-semibold text-sm text-gray-900 mb-3">
          Items de la venta ({sale.items.length})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 font-medium text-gray-700">Medicamento</th>
                <th className="text-right p-2 font-medium text-gray-700">Cantidad</th>
                <th className="text-right p-2 font-medium text-gray-700">Precio Unit.</th>
                {sale.items.some(item => item.listPrice) && (
                  <th className="text-right p-2 font-medium text-gray-700">Precio Lista</th>
                )}
                {sale.items.some(item => item.discount) && (
                  <th className="text-right p-2 font-medium text-gray-700">Descuento</th>
                )}
                <th className="text-right p-2 font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sale.items.map((item, index) => (
                <tr key={`${item.batchId}-${index}`} className="hover:bg-gray-50">
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{item.medicationId}</div>
                      <div className="text-gray-500">Lote: {item.batchId}</div>
                    </div>
                  </td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  {sale.items.some(i => i.listPrice) && (
                    <td className="p-2 text-right">
                      {item.listPrice ? formatCurrency(item.listPrice) : '-'}
                    </td>
                  )}
                  {sale.items.some(i => i.discount) && (
                    <td className="p-2 text-right text-red-600">
                      {item.discount ? `-${formatCurrency(item.discount)}` : '-'}
                    </td>
                  )}
                  <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

SaleDetails.displayName = 'SaleDetails';

export default SaleDetails;
