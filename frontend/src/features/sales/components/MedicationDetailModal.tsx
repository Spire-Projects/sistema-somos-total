import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { formatCurrency, formatDate, getBatchStatus, getBatchStatusColor, getBatchStatusText } from '@/shared/services/BatchService';
import { Package, Calendar, Factory, Tag, Pill, AlertCircle } from 'lucide-react';
import type { SaleItem } from '../types/sale.types';

interface MedicationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationItem: SaleItem | null;
}

const MedicationDetailModal = memo(({ open, onOpenChange, medicationItem }: MedicationDetailModalProps) => {
  if (!medicationItem) return null;

  const medication = medicationItem.medication;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Detalles del Medicamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Información Básica
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nombre Comercial:</span>
                <p className="text-gray-900">{medication.comercialName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Nombre de Marca:</span>
                <p className="text-gray-900">{medication.tradeName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Nombre Genérico:</span>
                <p className="text-gray-900">{medication.genericName}</p>
              </div>
              {medication.concentration && (
                <div>
                  <span className="font-medium text-gray-700">Concentración:</span>
                  <p className="text-gray-900">{medication.concentration}</p>
                </div>
              )}
              {medication.presentation && (
                <div>
                  <span className="font-medium text-gray-700">Presentación:</span>
                  <p className="text-gray-900">{medication.presentation}</p>
                </div>
              )}
              {medication.barcode && (
                <div>
                  <span className="font-medium text-gray-700">Código de Barras:</span>
                  <p className="text-gray-900 font-mono">{medication.barcode}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Información del fabricante y categoría */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Fabricante y Categoría
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Fabricante:</span>
                <p className="text-gray-900">{medication.manufacturerName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Categoría:</span>
                <p className="text-gray-900">{medication.categoryName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Forma Farmacéutica:</span>
                <p className="text-gray-900">{medication.pharmaceuticalFormName}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de stock */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock Disponible
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Stock Total:</span>
                <p className="text-lg font-bold text-green-600">{medication.totalActiveStock} unidades</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Lotes Activos:</span>
                <p className="text-lg font-bold text-blue-600">{medication.activeBatchCount} lotes</p>
              </div>
            </div>
          </div>

          {/* Información de lotes */}
          {medication.activeBatches && medication.activeBatches.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Lotes Disponibles ({medication.activeBatches.length})
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {medication.activeBatches.map((batch) => {
                    const status = getBatchStatus(batch.expirationDate);
                    return (
                      <div key={batch.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">Lote #{batch.batchId}</span>
                          <Badge className={getBatchStatusColor(status)}>
                            {getBatchStatusText(status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Stock:</span> {batch.quantity} unidades
                          </div>
                          <div>
                            <span className="font-medium">Vencimiento:</span> {formatDate(batch.expirationDate)}
                          </div>
                          <div>
                            <span className="font-medium">Precio Venta:</span> {formatCurrency(batch.sellingPrice)}
                          </div>
                          <div>
                            <span className="font-medium">Días restantes:</span> {batch.daysToExpiration} días
                          </div>
                          {batch.supplier && (
                            <div className="col-span-2">
                              <span className="font-medium">Proveedor:</span> {batch.supplier}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Información de la venta */}
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              En esta Venta
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Cantidad:</span>
                <p className="text-lg font-bold text-blue-600">{medicationItem.quantity} unidades</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Subtotal:</span>
                <p className="text-lg font-bold text-green-600">{formatCurrency(medicationItem.totalPrice)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Precio Unitario:</span>
                <p className="text-gray-900">{formatCurrency(medicationItem.unitPrice)}</p>
              </div>
              {medicationItem.batchId && (
                <div>
                  <span className="font-medium text-gray-700">Lote Seleccionado:</span>
                  <p className="text-gray-900">#{medicationItem.batchId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

MedicationDetailModal.displayName = 'MedicationDetailModal';

export default MedicationDetailModal;
