import { memo, useCallback } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Badge } from '@/shared/components/ui/badge';
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import type { MedicationCatalogFilters } from '@/shared/types/MedicationViewTypes';

interface MedicationFiltersProps {
  filters: MedicationCatalogFilters;
  onChange: (filters: MedicationCatalogFilters) => void;
  onClear: () => void;
  disabled?: boolean;
}

const STOCK_STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'in_stock', label: 'En stock' },
  { value: 'low_stock', label: 'Stock bajo' },
  { value: 'out_of_stock', label: 'Sin stock' },
  { value: 'overstocked', label: 'Exceso de stock' }
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Con stock' },
  { value: 'false', label: 'Sin stock' }
];

export const MedicationFilters = memo<MedicationFiltersProps>(({
  filters,
  onChange,
  onClear,
  disabled = false
}) => {
  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== null
  ).length;

  const handleFilterChange = useCallback((key: keyof MedicationCatalogFilters, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === undefined || value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onChange(newFilters);
  }, [filters, onChange]);

  const handleStockStatusChange = useCallback((value: string) => {
    handleFilterChange('stockStatus', value || undefined);
  }, [handleFilterChange]);

  const handleHasStockChange = useCallback((value: string) => {
    const boolValue = value === 'true' ? true : value === 'false' ? false : undefined;
    handleFilterChange('hasStock', boolValue);
  }, [handleFilterChange]);

  const handleMinStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleFilterChange('minStock', value ? Number(value) : undefined);
  }, [handleFilterChange]);

  const handleMaxStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleFilterChange('maxStock', value ? Number(value) : undefined);
  }, [handleFilterChange]);

  const handleExpiringDaysChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleFilterChange('expiringInDays', value ? Number(value) : undefined);
  }, [handleFilterChange]);

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            disabled={disabled}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 space-y-4" align="end">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Filtros</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Stock Status Filter - RadioGroup */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Estado de Stock</Label>
            <RadioGroup 
              value={filters.stockStatus || ''}
              onValueChange={handleStockStatusChange}
              className="flex flex-col space-y-1"
            >
              {STOCK_STATUS_OPTIONS.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`stock-status-${option.value}`} />
                  <Label 
                    htmlFor={`stock-status-${option.value}`} 
                    className="text-sm cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Has Stock Filter - RadioGroup */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Disponibilidad</Label>
            <RadioGroup
              value={filters.hasStock === true ? 'true' : filters.hasStock === false ? 'false' : ''}
              onValueChange={handleHasStockChange}
              className="flex flex-col space-y-1"
            >
              {AVAILABILITY_OPTIONS.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`availability-${option.value}`} />
                  <Label 
                    htmlFor={`availability-${option.value}`} 
                    className="text-sm cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Stock Range */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Rango de Stock</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Min"
                  min="0"
                  value={filters.minStock || ''}
                  onChange={handleMinStockChange}
                  className="text-xs"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Max"
                  min="0"
                  value={filters.maxStock || ''}
                  onChange={handleMaxStockChange}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Expiring Days Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Vencimiento (días)</Label>
            <Input
              type="number"
              placeholder="Días hasta vencimiento"
              min="0"
              value={filters.expiringInDays || ''}
              onChange={handleExpiringDaysChange}
              className="text-xs"
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Show active filters as badges */}
      {activeFilterCount > 0 && (
        <div className="flex gap-1 flex-wrap">
          {filters.stockStatus && (
            <Badge variant="secondary" className="text-xs">
              Estado: {STOCK_STATUS_OPTIONS.find(opt => opt.value === filters.stockStatus)?.label}
            </Badge>
          )}
          {filters.hasStock !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {filters.hasStock ? 'Con stock' : 'Sin stock'}
            </Badge>
          )}
          {filters.minStock !== undefined && (
            <Badge variant="secondary" className="text-xs">
              Min: {filters.minStock}
            </Badge>
          )}
          {filters.maxStock !== undefined && (
            <Badge variant="secondary" className="text-xs">
              Max: {filters.maxStock}
            </Badge>
          )}
          {filters.expiringInDays !== undefined && (
            <Badge variant="secondary" className="text-xs">
              Vence en: {filters.expiringInDays}d
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

MedicationFilters.displayName = 'MedicationFilters';