import { memo } from 'react';
import { formatCurrency } from '@/shared/services/BatchService';
import { Package } from 'lucide-react';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

interface MedicationSearchItemProps {
  medication: MedicationCatalogView;
  onAddToSale: (medication: MedicationCatalogView) => void;
}

const MedicationSearchItem = memo(({ medication, onAddToSale }: MedicationSearchItemProps) => {
  // Para obtener el precio, usamos el primer lote (más próximo a vencer) de activeBatches
  const nearestBatch = medication.activeBatches?.[0];
  const price = nearestBatch?.sellingPrice || 0;
  
  // Verificar si el lote más próximo tiene pocas unidades (menos de 30)
  const isLowStock = nearestBatch && nearestBatch.quantity < 30;
  const nextBatch = medication.activeBatches?.[1]; // Segundo lote disponible
  
  const handleItemClick = () => {
    onAddToSale(medication);
  };

  return (
    <div 
      onClick={handleItemClick}
      className="w-full p-3 hover:bg-rose-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors duration-150"
    >
      <div className="w-full">
        {/* Nombres del medicamento */}
        <div className="space-y-1 mb-2">
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

        {/* Información adicional - Layout responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Package className="h-3 w-3 flex-shrink-0" />
              <span className="whitespace-nowrap">Stock: {medication.totalActiveStock}</span>
            </div>
            
            {medication.concentration && (
              <div className="text-xs text-gray-500 truncate">
                {medication.concentration}
              </div>
            )}
          </div>
          
          <div className="text-sm text-green-600 font-semibold whitespace-nowrap">
            {formatCurrency(price)}
          </div>
        </div>

        {/* Advertencia de stock bajo */}
        {isLowStock && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-xs text-amber-800 min-w-0">
                <p className="font-medium">Stock limitado en lote actual</p>
                <p className="break-words">
                  Solo quedan <span className="font-semibold">{nearestBatch.quantity} unidades</span> 
                  {nextBatch && (
                    <span className="block sm:inline">
                      {' '}• Siguiente lote: <span className="font-semibold">{formatCurrency(nextBatch.sellingPrice)}</span>
                      {' '}({nextBatch.quantity} unidades)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Código de barras si existe */}
        {medication.barcode && (
          <div className="mt-2">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded truncate block max-w-fit">
              CB: {medication.barcode}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

MedicationSearchItem.displayName = 'MedicationSearchItem';

export default MedicationSearchItem;
