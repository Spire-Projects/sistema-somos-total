import { memo } from 'react';
import { formatCurrency } from '@/shared/services/BatchService';
import { Button } from '@/shared/components/ui/button';
import { Plus, Package } from 'lucide-react';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

interface MedicationSearchItemProps {
  medication: MedicationCatalogView;
  onAddToSale: (medication: MedicationCatalogView) => void;
}

const MedicationSearchItem = memo(({ medication, onAddToSale }: MedicationSearchItemProps) => {
  // Para obtener el precio, necesitamos buscar en activeBatches el lote más próximo a vencer
  const price = medication.activeBatches?.[0]?.sellingPrice || 0;
  
  const handleAddClick = () => {
    onAddToSale(medication);
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        {/* Nombres del medicamento */}
        <div className="space-y-1">
          <p className="font-medium text-sm text-gray-900 truncate">
            {medication.comercialName}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {medication.tradeName}
          </p>
          {medication.genericName && (
            <p className="text-xs text-gray-500 truncate">
              Genérico: {medication.genericName}
            </p>
          )}
        </div>

        {/* Información adicional */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Package className="h-3 w-3" />
            <span>Stock: {medication.totalActiveStock}</span>
          </div>
          
          <div className="text-xs text-green-600 font-medium">
            {formatCurrency(price)}
          </div>

          {medication.concentration && (
            <div className="text-xs text-gray-500">
              {medication.concentration}
            </div>
          )}
        </div>

        {/* Código de barras si existe */}
        {medication.barcode && (
          <div className="mt-1">
            <span className="text-xs text-gray-400">
              CB: {medication.barcode}
            </span>
          </div>
        )}
      </div>

      {/* Botón para agregar */}
      <div className="ml-3 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddClick}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

MedicationSearchItem.displayName = 'MedicationSearchItem';

export default MedicationSearchItem;
