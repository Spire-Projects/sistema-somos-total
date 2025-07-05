import { memo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog.tsx";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
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
  const [discountEditMode, setDiscountEditMode] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  const {
    saleState,
    addMedicationToSale,
    updateItemQuantity,
    updateItemDiscount,
    setClientDiscount,
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

  // Aplicar descuento personalizado
  const handleApplyDiscount = () => {
    if (discountValue > 0) {
      setClientDiscount(discountType, discountValue);
    } else {
      setClientDiscount('percentage', 0);
    }
    setDiscountEditMode(false);
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
                    onUpdateDiscount={updateItemDiscount}
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
                  <span>SUBTOTAL (Bs):</span>
                  <span>{formatCurrency(saleState.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>MONTO CON DESC (Bs):</span>
                  <span>{formatCurrency(saleState.amountWithDiscount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>MONTO SIN DESC (Bs):</span>
                  <span>{formatCurrency(saleState.amountWithoutDiscount)}</span>
                </div>
                
                {/* Descuento de cliente */}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm items-center">
                    <span>DESC. CLIENTE:</span>
                    <div className="flex items-center gap-2">
                      {saleState.clientDiscount ? (
                        <span className="text-orange-600">
                          {saleState.clientDiscount.type === 'percentage' 
                            ? `${saleState.clientDiscount.value}%` 
                            : formatCurrency(saleState.clientDiscount.value)
                          }
                        </span>
                      ) : (
                        <span className="text-gray-400">Sin descuento</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setDiscountEditMode(!discountEditMode)}
                      >
                        {discountEditMode ? 'Cancelar' : 'Editar'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Controles de edición del descuento */}
                  {discountEditMode && (
                    <div className="mt-2 p-2 bg-gray-50 rounded space-y-2">
                      <div className="flex gap-2">
                        <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                          <SelectTrigger className="w-24 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">Bs</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="flex-1 h-6 text-xs"
                          min="0"
                          step={discountType === 'percentage' ? "1" : "0.01"}
                          max={discountType === 'percentage' ? 100 : saleState.subtotal}
                        />
                        <Button
                          size="sm"
                          onClick={handleApplyDiscount}
                          className="h-6 px-2 text-xs"
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />
                
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>TOTAL AHORRADO (Bs):</span>
                  <span>{formatCurrency(saleState.totalSaved)}</span>
                </div>
                
                <Separator />
                <div className="flex justify-between font-bold !text-sm">
                  <span>TOTAL POR COBRAR (Bs):</span>
                  <span className="text-green-600">{formatCurrency(saleState.total)}</span>
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
