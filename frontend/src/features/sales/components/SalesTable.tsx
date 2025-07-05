import { memo } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import SaleRow from './SaleRow';
import type { Sale } from '@/shared/types/Sales';

interface SalesTableProps {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
}

const SalesTable = memo(({ sales, isLoading, error }: SalesTableProps) => {
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="text-sm">Error al cargar las ventas:</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Ventas Registradas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">Cargando ventas...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">No se encontraron ventas</p>
            <p className="text-xs mt-1">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm w-10"></th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">
                    Venta
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">
                    Cliente
                  </th>
                  <th className="text-center p-3 font-medium text-gray-700 text-sm">
                    Items
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">
                    Pago
                  </th>
                  <th className="text-right p-3 font-medium text-gray-700 text-sm">
                    Total
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">
                    Estado
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">
                    Vendedor
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SalesTable.displayName = 'SalesTable';

export default SalesTable;
