import { memo, useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight, Receipt, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { formatCurrency } from '@/shared/services/BatchService';
import { formatDate } from '@/shared/utils/date.utils';
import { UserService } from '@/shared/services/UserService';
import SaleDetails from './SaleDetails';
import type { Sale } from '@/shared/types/Sales';
import type { AuthUser } from '@/shared/types/User';

interface SaleRowProps {
  sale: Sale;
}

const PaymentMethodIcon = memo(({ method }: { method: string }) => {
  switch (method) {
    case 'efectivo':
      return <Banknote className="h-3 w-3" />;
    case 'tarjeta':
      return <CreditCard className="h-3 w-3" />;
    case 'transferencia':
      return <Smartphone className="h-3 w-3" />;
    default:
      return <Receipt className="h-3 w-3" />;
  }
});

PaymentMethodIcon.displayName = 'PaymentMethodIcon';

const SaleRow = memo(({ sale }: SaleRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [createdByUser, setCreatedByUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Cargar información del usuario que creó la venta
  useEffect(() => {
    const fetchCreatedByUser = async () => {
      if (!sale.createdBy) {
        setLoadingUser(false);
        return;
      }

      try {
        setLoadingUser(true);
        const response = await UserService.getUserById(sale.createdBy);
        if (response.success && response.user) {
          setCreatedByUser(response.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCreatedByUser();
  }, [sale.createdBy]);

  // Función para mostrar el nombre del usuario
  const getCreatedByDisplay = () => {
    if (loadingUser) return '...';
    if (createdByUser) return createdByUser.fullName;
    return sale.createdBy || 'Desconocido';
  };

  return (
    <>
      {/* Fila principal */}
      <tr className="hover:bg-gray-50 border-b border-gray-200">
        <td className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </td>
        
        <td className="p-3">
          <div className="space-y-1">
            <div className="font-medium text-sm text-gray-900">
              #{sale.id.slice(-8)}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(sale.createdAt)}
            </div>
          </div>
        </td>

        <td className="p-3">
          <div className="text-sm text-gray-900">
            {sale.client || 'Cliente general'}
          </div>
        </td>

        <td className="p-3">
          <div className="text-sm text-center">
            {sale.items.length}
          </div>
        </td>

        <td className="p-3">
          <div className="flex items-center gap-2 text-sm">
            <PaymentMethodIcon method={sale.paymentMethod} />
            <span className="capitalize">{sale.paymentMethod}</span>
          </div>
        </td>

        <td className="p-3">
          <div className="text-sm font-semibold text-green-600">
            {formatCurrency(sale.total)}
          </div>
        </td>

        <td className="p-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              sale.factured 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {sale.factured ? 'Facturado' : 'Pendiente'}
            </span>
          </div>
        </td>

        <td className="p-3">
          <div className="text-xs text-gray-500">
            {getCreatedByDisplay()}
          </div>
        </td>
      </tr>

      {/* Fila expandida con detalles */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <SaleDetails sale={sale} />
          </td>
        </tr>
      )}
    </>
  );
});

SaleRow.displayName = 'SaleRow';

export default SaleRow;
