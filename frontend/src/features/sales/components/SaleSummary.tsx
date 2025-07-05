import { memo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator.tsx";
import { formatCurrency } from "@/shared/services/BatchService";
import type { SaleState } from "../types/sale.types";

interface SaleSummaryProps {
  saleState: SaleState;
  onClientDiscountChange: (type: 'percentage' | 'fixed', value: number) => void;
  onConfirmSale: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const SaleSummary = memo(({
  saleState,
  onClientDiscountChange,
  onConfirmSale,
  onCancel,
  isProcessing = false
}: SaleSummaryProps) => {
  const [discountEditMode, setDiscountEditMode] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Aplicar descuento personalizado
  const handleApplyDiscount = () => {
    if (discountValue > 0) {
      onClientDiscountChange(discountType, discountValue);
    } else {
      onClientDiscountChange('percentage', 0);
    }
    setDiscountEditMode(false);
  };

  return (
    <>
      {/* Resumen de venta */}
      <Card className="!gap-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex justify-between text-xs">
            <span>SUBTOTAL (Bs):</span>
            <span>{formatCurrency(saleState.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-blue-600">
            <span>MONTO CON DESC (Bs):</span>
            <span>{formatCurrency(saleState.amountWithDiscount)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>MONTO SIN DESC (Bs):</span>
            <span>{formatCurrency(saleState.amountWithoutDiscount)}</span>
          </div>
          
          {/* Descuento de cliente */}
          <div className="border-t pt-2">
            <div className="flex justify-between text-xs items-center">
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
                  className="h-5 px-1 text-xs"
                  onClick={() => setDiscountEditMode(!discountEditMode)}
                  disabled={isProcessing}
                >
                  {discountEditMode ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </div>
            
            {/* Controles de edición del descuento */}
            {discountEditMode && (
              <div className="mt-2 p-2 bg-gray-50 rounded space-y-2">
                <div className="flex gap-2">
                  <Select 
                    value={discountType} 
                    onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="w-20 h-5 text-xs">
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
                    className="flex-1 h-5 text-xs"
                    min="0"
                    step={discountType === 'percentage' ? "1" : "0.01"}
                    max={discountType === 'percentage' ? 100 : saleState.subtotal}
                    disabled={isProcessing}
                  />
                  <Button
                    size="sm"
                    onClick={handleApplyDiscount}
                    className="h-5 px-2 text-xs"
                    disabled={isProcessing}
                  >
                    OK
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />
          
          <div className="flex justify-between text-xs text-green-600 font-medium">
            <span>TOTAL AHORRADO (Bs):</span>
            <span>{formatCurrency(saleState.totalSaved)}</span>
          </div>
          
          <Separator />
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL POR COBRAR (Bs):</span>
            <span className="text-green-600">{formatCurrency(saleState.total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="space-y-2 pt-2">
        <Button 
          onClick={onConfirmSale}
          className="w-full h-8 text-xs"
          size="sm"
          disabled={isProcessing || saleState.items.length === 0}
        >
          {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full h-8 text-xs"
          size="sm"
          disabled={isProcessing}
        >
          Cancelar
        </Button>
      </div>
    </>
  );
});

SaleSummary.displayName = 'SaleSummary';

export default SaleSummary;
