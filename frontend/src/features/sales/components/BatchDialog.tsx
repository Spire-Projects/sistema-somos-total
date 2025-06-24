import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Calendar, Package, DollarSign, Percent } from 'lucide-react';
import type { Medication } from '../../../shared/types/Medication';
import type { BatchWithMedication, CreateBatchData } from '../../../shared/types/Sales';

interface BatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batch?: BatchWithMedication | null;
  mode: 'create' | 'edit';
  medications: Medication[];
}

export const BatchDialog: React.FC<BatchDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batch,
  mode,
  medications
}) => {
  const [formData, setFormData] = useState<Partial<CreateBatchData>>({
    medicationId: '',
    batchId: '',
    expirationDate: '',
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: '',
    createdBy: 'current-user' // TODO: Get from auth context
  });

  const [profitMargin, setProfitMargin] = useState(0);
  const [isProfitMode, setIsProfitMode] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Calcular precio de venta basado en margen de ganancia
  const calculateSellingPrice = (purchasePrice: number, margin: number) => {
    return purchasePrice * (1 + margin / 100);
  };

  // Calcular margen basado en precios
  const calculateProfitMargin = (purchasePrice: number, sellingPrice: number) => {
    if (purchasePrice <= 0) return 0;
    return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && batch) {
        setFormData({
          medicationId: batch.medication.id,
          batchId: batch.batchId,
          expirationDate: batch.expirationDate,
          quantity: batch.quantity,
          purchasePrice: batch.purchasePrice,
          sellingPrice: batch.sellingPrice,
          purchaseDate: batch.purchaseDate || new Date().toISOString().split('T')[0],
          supplier: batch.supplier || '',
          createdBy: batch.createdBy || 'current-user'
        });
        setProfitMargin(calculateProfitMargin(batch.purchasePrice, batch.sellingPrice));
      } else {
        // Reset form for create mode
        setFormData({
          medicationId: '',
          batchId: '',
          expirationDate: '',
          quantity: 0,
          purchasePrice: 0,
          sellingPrice: 0,
          purchaseDate: new Date().toISOString().split('T')[0],
          supplier: '',
          createdBy: 'current-user'
        });
        setProfitMargin(0);
      }
      setErrors({});
    }
  }, [isOpen, mode, batch]);

  // Update selling price when purchase price or profit margin changes
  useEffect(() => {
    if (isProfitMode && formData.purchasePrice && profitMargin >= 0) {
      const newSellingPrice = calculateSellingPrice(formData.purchasePrice, profitMargin);
      setFormData(prev => ({ ...prev, sellingPrice: Math.round(newSellingPrice * 100) / 100 }));
    }
  }, [formData.purchasePrice, profitMargin, isProfitMode]);

  // Update profit margin when selling price changes (manual mode)
  useEffect(() => {
    if (!isProfitMode && formData.purchasePrice && formData.sellingPrice) {
      setProfitMargin(calculateProfitMargin(formData.purchasePrice, formData.sellingPrice));
    }
  }, [formData.purchasePrice, formData.sellingPrice, isProfitMode]);

  const handleInputChange = (field: keyof CreateBatchData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProfitMarginChange = (value: number) => {
    setProfitMargin(value);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.medicationId) {
      newErrors.medicationId = 'Selecciona un medicamento';
    }

    if (!formData.batchId?.trim()) {
      newErrors.batchId = 'El ID del lote es requerido';
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = 'La fecha de vencimiento es requerida';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (!formData.purchasePrice || formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'El precio de compra debe ser mayor a 0';
    }

    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'El precio de venta debe ser mayor a 0';
    }

    if (formData.sellingPrice && formData.purchasePrice && formData.sellingPrice < formData.purchasePrice) {
      newErrors.sellingPrice = 'El precio de venta no puede ser menor al precio de compra';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual API calls
      console.log('Batch data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedMedication = medications.find(m => m.id === formData.medicationId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === 'create' ? 'Agregar Nuevo Lote' : 'Editar Lote'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Medicamento */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Información del Medicamento
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="medicationId">Medicamento *</Label>
                <Select
                  value={formData.medicationId}
                  onValueChange={(value) => handleInputChange('medicationId', value)}
                  disabled={mode === 'edit'}
                >
                  <SelectTrigger className={errors.medicationId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona un medicamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((medication) => (
                      <SelectItem key={medication.id} value={medication.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{medication.tradeName}</span>
                          <span className="text-sm text-gray-500">{medication.genericName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.medicationId && (
                  <p className="text-sm text-red-500">{errors.medicationId}</p>
                )}
              </div>

              {selectedMedication && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <p><strong>Concentración:</strong> {selectedMedication.concentration}</p>
                    <p><strong>Presentación:</strong> {selectedMedication.presentation}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Lote */}
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
                    <p className="text-sm text-red-500">{errors.batchId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    className={errors.quantity ? 'border-red-500' : ''}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500">{errors.quantity}</p>
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
                    <p className="text-sm text-red-500">{errors.expirationDate}</p>
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

          {/* Precios */}
          <Card>
            <CardContent className="p-4 space-y-4">
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
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                    className={errors.purchasePrice ? 'border-red-500' : ''}
                  />
                  {errors.purchasePrice && (
                    <p className="text-sm text-red-500">{errors.purchasePrice}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Método de Cálculo</Label>
                  <div className="flex gap-2">
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
                      value={profitMargin}
                      onChange={(e) => handleProfitMarginChange(parseFloat(e.target.value) || 0)}
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
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                      className={errors.sellingPrice ? 'border-red-500' : ''}
                    />
                    {errors.sellingPrice && (
                      <p className="text-sm text-red-500">{errors.sellingPrice}</p>
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

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : (mode === 'create' ? 'Crear Lote' : 'Actualizar Lote')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
