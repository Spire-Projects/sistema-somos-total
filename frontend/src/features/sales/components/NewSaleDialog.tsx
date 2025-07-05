import { memo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog.tsx";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ShoppingCart, Receipt } from 'lucide-react';
import MedicationSearch from './MedicationSearch';
import SaleItemsTable from './SaleItemsTable';
import SaleClientAndSummary from './SaleClientAndSummary';
import StockErrorDialog from './StockErrorDialog';
import SaleSuccessDialog from './SaleSuccessDialog';
import { useSaleManager } from '../hooks/useSaleManager';
import { useSaleProcessor } from '../hooks/useSaleProcessor';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';
import type { Client } from '@/shared/types/Client';
import type { Medic } from '@/shared/types/Sales';

interface NewSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewSaleDialog = memo(({ open, onOpenChange }: NewSaleDialogProps) => {
  const [showStockError, setShowStockError] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [stockErrorItems, setStockErrorItems] = useState<Array<{
    batchId: string;
    medicationId: string;
    requestedQuantity: number;
    availableQuantity: number;
  }>>([]);

  const {
    saleState,
    addMedicationToSale,
    updateItemQuantity,
    updateItemDiscount,
    setClientDiscount,
    removeItem,
    clearSale,
    setClient,
    setMedic
  } = useSaleManager();

  const {
    isProcessing,
    error: processingError,
    lastSale,
    processSale,
    clearError,
    clearLastSale
  } = useSaleProcessor();

  // Manejar selección de medicamento desde la búsqueda
  const handleMedicationSelect = (medication: MedicationCatalogView) => {
    addMedicationToSale(medication);
  };

  // Manejar confirmación de venta
  const handleConfirmSale = async () => {
    if (saleState.items.length === 0) {
      return;
    }

    try {
      clearError();
      const result = await processSale(saleState, 'current-user'); // TODO: Obtener usuario actual

      if (result.success && result.sale) {
        // Venta exitosa
        setShowSuccessDialog(true);
        clearSale(); // Limpiar el estado de la venta
      } else if (result.failedItems && result.failedItems.length > 0) {
        // Error de stock
        setStockErrorItems(result.failedItems);
        setShowStockError(true);
      } else {
        // Otro tipo de error
        console.error('Error en venta:', result.error);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  // Manejar cancelación
  const handleCancel = () => {
    clearSale();
    onOpenChange(false);
  };

  // Manejar cierre del diálogo principal
  const handleMainDialogClose = (open: boolean) => {
    if (!open && !isProcessing) {
      clearSale();
      clearError();
      clearLastSale();
    }
    onOpenChange(open);
  };

  // Manejar cierre del diálogo de éxito
  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    onOpenChange(false); // Cerrar también el diálogo principal
  };

  // Manejar cierre del diálogo de error de stock
  const handleStockErrorClose = () => {
    setShowStockError(false);
    setStockErrorItems([]);
  };

  // Manejar selección de cliente
  const handleClientSelect = (client: Client | null) => {
    if (client) {
      setClient(client.id, client.name);
    } else {
      setClient();
    }
  };

  // Manejar selección de médico
  const handleMedicSelect = (medic: Medic | null) => {
    if (medic) {
      setMedic(medic.id, medic.fullName);
    } else {
      setMedic();
    }
  };

  // Manejar cambio de descuento de cliente
  const handleClientDiscountChange = (type: 'percentage' | 'fixed', value: number) => {
    setClientDiscount(type, value);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleMainDialogClose}>
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
              <Card className="!gap-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Buscar Medicamentos</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 !gap-0">
                  <MedicationSearch
                    onMedicationSelect={handleMedicationSelect}
                    placeholder="Buscar por nombre o código de barras..."
                    className="w-full"
                    disabled={isProcessing}
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
                        disabled={isProcessing}
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
                      onUpdateDiscount={updateItemDiscount}
                      onRemove={removeItem}
                      disabled={isProcessing}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sección de cliente y resumen */}
            <SaleClientAndSummary
              saleState={saleState}
              onClientSelect={handleClientSelect}
              onMedicSelect={handleMedicSelect}
              onClientDiscountChange={handleClientDiscountChange}
              onConfirmSale={handleConfirmSale}
              onCancel={handleCancel}
              isProcessing={isProcessing}
            />
          </div>

          {/* Mostrar error de procesamiento si existe */}
          {processingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-red-800">{processingError}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de error de stock */}
      <StockErrorDialog
        isOpen={showStockError}
        onClose={handleStockErrorClose}
        failedItems={stockErrorItems}
      />

      {/* Diálogo de venta exitosa */}
      {lastSale && (
        <SaleSuccessDialog
          isOpen={showSuccessDialog}
          onClose={handleSuccessClose}
          sale={lastSale}
        />
      )}
    </>
  );
});

export default NewSaleDialog;
