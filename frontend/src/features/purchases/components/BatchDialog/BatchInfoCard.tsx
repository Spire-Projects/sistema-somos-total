import React, { memo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Input } from '../../../../shared/components/ui/input';
import { Label } from '../../../../shared/components/ui/label';
import { Calendar } from 'lucide-react';
import CreatableSelect from '../../../../shared/components/CreatableSelect';
import type { BatchFormData } from '../../utils/batchForm.utils';
import type { FieldErrors } from 'react-hook-form';
import type { Manufacturer } from '../../../../shared/types/Medication';
import {
  findManufacturersPaginated,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} from '../../../../shared/services';

interface BatchInfoCardProps {
  formData: BatchFormData;
  errors: FieldErrors<BatchFormData>;
  mode: 'create' | 'edit';
  handleInputChange: (field: keyof BatchFormData, value: string | number) => void;
  onManufacturerChange?: (manufacturer: Manufacturer | null) => void;
}

const BatchInfoCard: React.FC<BatchInfoCardProps> = ({
  formData,
  errors,
  mode,
  handleInputChange,
  onManufacturerChange
}) => {
  // Estado para los manufacturers iniciales
  const [initialManufacturers, setInitialManufacturers] = useState<Manufacturer[]>([]);
  const [manufacturersLoading, setManufacturersLoading] = useState(true);

  // Cargar manufacturers iniciales (primeros 10)
  useEffect(() => {
    const loadInitialManufacturers = async () => {
      try {
        setManufacturersLoading(true);
        const response = await findManufacturersPaginated(1, 10);
        setInitialManufacturers(response.items);
      } catch (error) {
        console.error("Error loading initial manufacturers:", error);
        setInitialManufacturers([]);
      } finally {
        setManufacturersLoading(false);
      }
    };

    loadInitialManufacturers();
  }, []);

  const searchManufacturersList = useCallback(
    async (query: string): Promise<Manufacturer[]> => {
      try {
        if (!query || query.trim() === "") {
          return initialManufacturers;
        }

        const response = await findManufacturersPaginated(1, 10, query);
        return response.items;
      } catch (error) {
        console.error("Error searching manufacturers:", error);
        return [];
      }
    },
    [initialManufacturers]
  );

  const handleCreateManufacturer = useCallback(
    async (name: string): Promise<Manufacturer> => {
      try {
        const newManufacturer = await createManufacturer({
          name,
          createdBy: "current-user", // TODO: Usar ID del usuario actual
        });

        setInitialManufacturers((prev) => [newManufacturer, ...prev]);
        return newManufacturer;
      } catch (error) {
        console.error("Error creating manufacturer:", error);
        throw error;
      }
    },
    []
  );

  const handleEditManufacturer = useCallback(
    async (updated: Manufacturer): Promise<Manufacturer | null> => {
      try {
        const edited = await updateManufacturer(updated.id, {
          name: updated.name,
        });

        if (!edited) return null;

        setInitialManufacturers((prev) =>
          prev.map((item) => (item.id === edited.id ? edited : item))
        );

        return edited;
      } catch (error) {
        console.error("Error editing manufacturer:", error);
        throw error;
      }
    },
    []
  );

  const handleDeleteManufacturer = useCallback(async (item: Manufacturer) => {
    try {
      await deleteManufacturer(item.id);
      setInitialManufacturers((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      console.error("Error deleting manufacturer:", error);
    }
  }, []);

  const handleManufacturerSelect = useCallback(
    (manufacturer: Manufacturer) => {
      handleInputChange('manufacturerId', manufacturer.id);
      handleInputChange('supplier', manufacturer.name);
      onManufacturerChange?.(manufacturer);
    },
    [handleInputChange, onManufacturerChange]
  );
  return (
    <Card className='p-0'>
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
            {manufacturersLoading ? (
              <div className="space-y-2">
                <Label>Proveedor/Fabricante</Label>
                <Input placeholder="Cargando fabricantes..." disabled />
              </div>
            ) : (
              <CreatableSelect<Manufacturer>
                label="Proveedor/Fabricante"
                values={initialManufacturers}
                selectedValue={formData.selectedManufacturer}
                onChange={handleManufacturerSelect}
                searchFunction={searchManufacturersList}
                onAddValue={handleCreateManufacturer}
                onEditValue={handleEditManufacturer}
                onDeleteValue={handleDeleteManufacturer}
                displayField="name"
                valueField="id"
                placeholder="Ej: Bayer, Pfizer, Genfar, MK"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(BatchInfoCard);