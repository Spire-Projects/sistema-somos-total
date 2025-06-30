import { memo, useCallback } from 'react';
import { Package, AlertTriangle, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import type { 
  MedicationCatalogView, 
  MedicationCatalogSort, 
  MedicationCatalogSortField 
} from '@/shared/types/MedicationViewTypes';

interface MedicationMobileListProps {
  medications: MedicationCatalogView[];
  loading?: boolean;
  sort?: MedicationCatalogSort;
  onSort?: (sort: MedicationCatalogSort) => void;
  onRowClick?: (medication: MedicationCatalogView) => void;
}

const SORT_OPTIONS: Array<{ value: MedicationCatalogSortField; label: string }> = [
  { value: 'tradeName', label: 'Nombre Comercial' },
  { value: 'genericName', label: 'Nombre Genérico' },
  { value: 'totalActiveStock', label: 'Stock' },
  { value: 'activeBatchCount', label: 'Lotes' },
  { value: 'createdAt', label: 'Fecha de Creación' },
];

const getStockStatusBadge = (status: MedicationCatalogView['stockStatus']) => {
  const variants = {
    'in_stock': { variant: 'default' as const, label: 'En Stock', color: 'text-green-700 bg-green-50 border-green-200' },
    'low_stock': { variant: 'secondary' as const, label: 'Stock Bajo', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    'out_of_stock': { variant: 'destructive' as const, label: 'Sin Stock', color: 'text-red-700 bg-red-50 border-red-200' },
    'overstocked': { variant: 'outline' as const, label: 'Exceso', color: 'text-blue-700 bg-blue-50 border-blue-200' }
  };
  
  const config = variants[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const LoadingSkeleton = memo(() => (
  <Card className="mb-3">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

export const MedicationMobileList = memo<MedicationMobileListProps>(({
  medications,
  loading = false,
  sort,
  onSort,
  onRowClick
}) => {
  const handleSort = useCallback((field: MedicationCatalogSortField) => {
    if (!onSort) return;
    
    const newOrder = sort?.field === field && sort.order === 'asc' ? 'desc' : 'asc';
    onSort({ field, order: newOrder });
  }, [sort, onSort]);

  const handleSortChange = useCallback((value: string) => {
    const field = value as MedicationCatalogSortField;
    handleSort(field);
  }, [handleSort]);

  const toggleSortOrder = useCallback(() => {
    if (!onSort || !sort) return;
    onSort({ 
      field: sort.field, 
      order: sort.order === 'asc' ? 'desc' : 'asc' 
    });
  }, [sort, onSort]);

  const handleCardClick = useCallback((medication: MedicationCatalogView) => {
    onRowClick?.(medication);
  }, [onRowClick]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No se encontraron medicamentos</p>
          <p className="text-gray-400 text-sm">Intenta ajustar los filtros de búsqueda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Sort Controls */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
        <div className="flex items-center gap-2 flex-1">
          <Select 
            value={sort?.field || 'tradeName'} 
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="px-3"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sort?.order === 'desc' ? '↓' : '↑'}
          </Button>
        </div>
      </div>

      {/* Medication Cards */}
      <div className="space-y-3">
        {medications.map((medication) => (
          <Card
            key={medication.id}
            className={`transition-all duration-200 p-0 ${
              onRowClick 
                ? 'cursor-pointer hover:shadow-md hover:border-blue-300' 
                : ''
            }`}
            onClick={() => handleCardClick(medication)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header with name and stock status */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {medication.tradeName}
                    </h3>
                    {medication.comercialName && (
                      <p className="text-sm text-gray-600 truncate">
                        {medication.comercialName}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 truncate">
                      {medication.genericName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStockStatusBadge(medication.stockStatus)}
                    {onRowClick && (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Concentración:</span>
                    <span className="font-medium">{medication.concentration}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Presentación:</span>
                    <span>{medication.presentation}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-gray-400" />
                      <span className="font-medium">{medication.totalActiveStock}</span>
                      <span className="text-gray-500">
                        ({medication.activeBatchCount} lote{medication.activeBatchCount !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>

                  {/* Expiration info */}
                  {medication.oldestActiveBatch && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Próximo vencimiento:</span>
                      <div className="flex items-center gap-1 text-right">
                        {medication.oldestActiveBatch.daysToExpiration <= 30 && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                        <div>
                          <div className="text-xs">
                            {formatDate(medication.oldestActiveBatch.expirationDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {medication.oldestActiveBatch.daysToExpiration}d restantes
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barcode if available */}
                  {medication.barcode && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Código:</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {medication.barcode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

MedicationMobileList.displayName = 'MedicationMobileList';
