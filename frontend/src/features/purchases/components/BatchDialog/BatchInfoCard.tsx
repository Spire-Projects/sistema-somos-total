import React, { memo } from 'react';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Input } from '../../../../shared/components/ui/input';
import { Label } from '../../../../shared/components/ui/label';
import { Calendar } from 'lucide-react';
import type { BatchFormData } from '../../utils/batchForm.utils';
import type { FieldErrors } from 'react-hook-form';

interface BatchInfoCardProps {
  formData: BatchFormData;
  errors: FieldErrors<BatchFormData>;
  mode: 'create' | 'edit';
  handleInputChange: (field: keyof BatchFormData, value: string | number) => void;
}

const BatchInfoCard: React.FC<BatchInfoCardProps> = ({
  formData,
  errors,
  mode,
  handleInputChange
}) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium">Información del Lote</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="batchId">ID del Lote *</Label>
            <Input
              id="batchId"
              value={formData.batchId}
              onChange={(e) => handleInputChange('batchId', e.target.value)}
              placeholder="Ej: LOT001, BATCH2024-01"
              className={errors.batchId ? 'border-red-500' : ''}
              disabled={mode === 'edit'}
            />
            {errors.batchId && (
              <p className="text-sm text-red-500">{errors.batchId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity === 0 ? '' : formData.quantity}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  handleInputChange('quantity', 0);
                } else {
                  handleInputChange('quantity', parseInt(value) || 0);
                }
              }}
              placeholder="0"
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Fecha de Compra</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Fecha de Vencimiento *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                className={`pl-10 ${errors.expirationDate ? 'border-red-500' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            {errors.expirationDate && (
              <p className="text-sm text-red-500">{errors.expirationDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(BatchInfoCard);