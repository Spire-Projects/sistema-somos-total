import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog.tsx";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator.tsx";
import { ShoppingCart, User, Receipt } from 'lucide-react';
import MedicationSearch from './MedicationSearch';
import SaleItemsTable from './SaleItemsTable';
import { useSaleManager } from '../hooks/useSaleManager';
import { formatCurrency } from '@/shared/services/BatchService';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

interface NewSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewSaleDialog = memo(({ open, onOpenChange }: NewSaleDialogProps) => {
  const {
    saleState,
    addMedicationToSale,
    updateItemQuantity,
    removeItem,
    clearSale
  } = useSaleManager();

  // Manejar selección de medicamento desde la búsqueda
  const handleMedicationSelect = (medication: MedicationCatalogView) => {
    addMedicationToSale(medication);
  };

  // Manejar confirmación de venta
  const handleConfirmSale = () => {
    // TODO: Implementar lógica de confirmación de venta
    console.log('Confirmar venta:', saleState);
    onOpenChange(false);
  };

  // Manejar cancelación
  const handleCancel = () => {
    clearSale();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] min-h-[80vh] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nueva Venta
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Sección de búsqueda de productos y items de venta */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Búsqueda de medicamentos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Buscar Medicamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <MedicationSearch
                  onMedicationSelect={handleMedicationSelect}
                  placeholder="Buscar por nombre o código de barras..."
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Lista de items de venta */}
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Items de Venta ({saleState.items.length})</span>
                  {saleState.items.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSale}
                      className="text-red-600 hover:text-red-700"
                    >
                      Limpiar Todo
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto max-h-[400px]">
                {saleState.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay productos agregados</p>
                    <p className="text-sm">Busca y selecciona medicamentos para agregar</p>
                  </div>
                ) : (
                  <SaleItemsTable
                    items={saleState.items}
                    onUpdateQuantity={updateItemQuantity}
                    onRemove={removeItem}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sección de cliente y resumen */}
          <div className="lg:w-80 flex flex-col gap-4">
            {/* Información del cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Cliente general</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Seleccionar Cliente
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de venta */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(saleState.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (13%):</span>
                  <span>{formatCurrency(saleState.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span className="text-lg">{formatCurrency(saleState.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="space-y-2">
              <Button 
                onClick={handleConfirmSale}
                className="w-full"
                disabled={saleState.items.length === 0}
              >
                Confirmar Venta
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default NewSaleDialog;
