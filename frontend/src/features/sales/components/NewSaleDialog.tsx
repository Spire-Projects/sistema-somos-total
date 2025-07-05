import { memo } from "react";
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
import { useSaleManager } from '../hooks/useSaleManager';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';
import type { Client } from '@/shared/types/Client';
import type { Medic } from '@/shared/types/Sales';

interface NewSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewSaleDialog = memo(({ open, onOpenChange }: NewSaleDialogProps) => {
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
            <Card className="!gap-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Buscar Medicamentos</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 !gap-0">
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
                    onUpdateDiscount={updateItemDiscount}
                    onRemove={removeItem}
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
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default NewSaleDialog;
