import React, { memo } from 'react';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { Input } from '../../../../shared/components/ui/input';
import { Label } from '../../../../shared/components/ui/label';
import { DollarSign, Percent } from 'lucide-react';
import type { BatchFormData } from '../../utils/batchForm.utils';
import type { FieldErrors } from 'react-hook-form';

interface BatchPriceCardProps {
  formData: BatchFormData;
  errors: FieldErrors<BatchFormData>;
  isProfitMode: boolean;
  profitMargin: number;
  setIsProfitMode: (value: boolean) => void;
  handleInputChange: (field: keyof BatchFormData, value: string | number) => void;
  handleProfitMarginChange: (value: number) => void;
}

const BatchPriceCard: React.FC<BatchPriceCardProps> = ({
  formData,
  errors,
  isProfitMode,
  profitMargin,
  setIsProfitMode,
  handleInputChange,
  handleProfitMarginChange
}) => {
  return (
    <Card className='p-0'>
      <CardContent className="p-2 m-3 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Precios
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Precio de Compra (Bs.) *</Label>
            <Input
              id="purchasePrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.purchasePrice === 0 ? '' : formData.purchasePrice}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  handleInputChange('purchasePrice', 0);
                } else {
                  handleInputChange('purchasePrice', parseFloat(value) || 0);
                }
              }}
              placeholder="0.00"
              className={errors.purchasePrice ? 'border-red-500' : ''}
            />
            {errors.purchasePrice && (
              <p className="text-sm text-red-500">{errors.purchasePrice.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Método de Cálculo</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={isProfitMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsProfitMode(true)}
                className="flex-1"
              >
                <Percent className="h-4 w-4 mr-1" />
                Por Margen
              </Button>
              <Button
                type="button"
                variant={!isProfitMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsProfitMode(false)}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Manual
              </Button>
            </div>
          </div>

          {isProfitMode ? (
            <div className="space-y-2">
              <Label htmlFor="profitMargin">Margen de Ganancia (%)</Label>
              <Input
                id="profitMargin"
                type="number"
                min="0"
                step="0.1"
                value={profitMargin === 0 ? '' : profitMargin}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleProfitMarginChange(0);
                  } else {
                    handleProfitMarginChange(parseFloat(value) || 0);
                  }
                }}
                placeholder="0.0"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Precio de Venta (Bs.) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice === 0 ? '' : formData.sellingPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleInputChange('sellingPrice', 0);
                  } else {
                    handleInputChange('sellingPrice', parseFloat(value) || 0);
                  }
                }}
                placeholder="0.00"
                className={errors.sellingPrice ? 'border-red-500' : ''}
              />
              {errors.sellingPrice && (
                <p className="text-sm text-red-500">{errors.sellingPrice.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Precio de Venta Final</Label>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-lg font-semibold text-green-700">
                Bs. {formData.sellingPrice?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-green-600">
                Margen: {profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default memo(BatchPriceCard);
