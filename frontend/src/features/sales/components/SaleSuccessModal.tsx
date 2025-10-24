import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2, Calendar, User, Receipt, DollarSign } from "lucide-react";
import { Separator } from "@/shared/components/ui/separator";
import type { SaleView } from "@/shared/types/modelTypes/Sale";

interface SaleSuccessModalProps {
  open: boolean;
  onClose: () => void;
  sale: SaleView | null;
}

const SaleSuccessModal = memo(({ open, onClose, sale }: SaleSuccessModalProps) => {
  if (!sale) return null;

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return `Bs ${value.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            ¡Venta realizada exitosamente!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mensaje de éxito */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">
              La venta ha sido registrada y el stock ha sido actualizado automáticamente
            </p>
          </div>

          {/* Información general */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Receipt className="h-4 w-4" />
                <span className="font-medium">Número de venta</span>
              </div>
              <p className="text-lg font-bold text-blue-600 pl-6">
                {sale.numberInvoice || 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Fecha y hora</span>
              </div>
              <p className="text-sm pl-6">{formatDate(sale.createdAt)}</p>
            </div>

            {sale.clientName && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Cliente</span>
                </div>
                <p className="text-sm pl-6">{sale.clientName}</p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Método de pago</span>
              </div>
              <p className="text-sm pl-6 capitalize">{sale.paymentMethod}</p>
            </div>
          </div>

          <Separator />

          {/* Total pagado */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">Total pagado:</span>
              <span className="text-3xl font-bold text-green-600">
                {formatCurrency(sale.total)}
              </span>
            </div>
            
            {sale.totalWithoutDiscount && sale.totalWithoutDiscount > sale.total && (
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-600">Monto sin descuento:</span>
                <span className="line-through text-gray-500">
                  {formatCurrency(sale.totalWithoutDiscount)}
                </span>
              </div>
            )}
            
            {sale.totalDiscount && sale.totalDiscount > 0 && (
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-orange-600">Total ahorrado:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(sale.totalDiscount)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Items vendidos */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Items vendidos ({sale.items.length})</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-600">Producto</th>
                      <th className="text-center p-2 font-medium text-gray-600">Cantidad</th>
                      <th className="text-right p-2 font-medium text-gray-600">Precio Unit.</th>
                      <th className="text-right p-2 font-medium text-gray-600">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sale.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{item.product}</div>
                          {item.discount > 0 && (
                            <div className="text-xs text-orange-600">
                              Desc. {item.discount}%
                            </div>
                          )}
                        </td>
                        <td className="text-center p-2">{item.quantity}</td>
                        <td className="text-right p-2">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right p-2 font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notas (si las hay) */}
          {sale.saleNotes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Notas de la venta</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {sale.saleNotes}
                </p>
              </div>
            </>
          )}

          {/* Botón para cerrar */}
          <div className="flex justify-end gap-2">
            <Button onClick={onClose} className="w-full sm:w-auto">
              Continuar
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-center text-gray-500 space-y-1">
            <p>Los datos de la venta han sido guardados correctamente.</p>
            <p>El inventario se ha actualizado automáticamente.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

SaleSuccessModal.displayName = 'SaleSuccessModal';

export default SaleSuccessModal;
