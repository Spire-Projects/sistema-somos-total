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
  const hasStock = medication.hasStock && medication.totalActiveStock > 0;
  
  // Verificar si el lote más próximo tiene pocas unidades (menos de 30)
  const isLowStock = nearestBatch && nearestBatch.quantity < 30;
  const nextBatch = medication.activeBatches?.[1]; // Segundo lote disponible
  
  const handleItemClick = () => {
    // Solo permitir selección si tiene stock
    if (hasStock) {
      onAddToSale(medication);
    }
  };

  return (
    <div 
      onClick={handleItemClick}
      className={`w-full p-3 border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
        hasStock 
          ? 'hover:bg-rose-50 cursor-pointer' 
          : 'bg-gray-50 cursor-not-allowed opacity-75'
      }`}
    >
      <div className="w-full">
        {/* Nombres del medicamento */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-sm truncate ${hasStock ? 'text-gray-900' : 'text-gray-500'}`}>
              {medication.comercialName}
            </p>
            {!hasStock && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                No disponible
              </span>
            )}
          </div>
          <p className={`text-xs truncate ${hasStock ? 'text-gray-600' : 'text-gray-400'}`}>
            {medication.tradeName}
          </p>
          {medication.genericName && (
            <p className={`text-xs truncate ${hasStock ? 'text-gray-500' : 'text-gray-400'}`}>
              Genérico: {medication.genericName}
            </p>
          )}
        </div>

        {/* Información adicional - Layout responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-1 text-xs ${hasStock ? 'text-gray-600' : 'text-gray-400'}`}>
              <Package className="h-3 w-3 flex-shrink-0" />
              <span className="whitespace-nowrap">
                Stock: {medication.totalActiveStock}
                {!hasStock && ' (Sin lotes disponibles)'}
              </span>
            </div>
            
            {medication.concentration && (
              <div className={`text-xs truncate ${hasStock ? 'text-gray-500' : 'text-gray-400'}`}>
                {medication.concentration}
              </div>
            )}
          </div>
          
          <div className={`text-sm font-semibold whitespace-nowrap ${
            hasStock ? 'text-green-600' : 'text-gray-400'
          }`}>
            {hasStock ? formatCurrency(price) : 'Sin precio'}
          </div>
        </div>

        {/* Advertencias de stock */}
        {!hasStock ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-xs text-red-800 min-w-0">
                <p className="font-medium">Medicamento no disponible</p>
                <p className="break-words">
                  {medication.totalActiveStock === 0 
                    ? 'No hay lotes en stock o todos están vencidos'
                    : 'Sin lotes registrados para este medicamento'
                  }
                </p>
              </div>
            </div>
          </div>
        ) : isLowStock && (
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
