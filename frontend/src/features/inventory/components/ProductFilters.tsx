import { memo, useState } from 'react';
import { Filter, X } from 'lucide-react';
import type { ProductFilter } from '@/shared/types/modelTypes/Product';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Separator } from '@/shared/components/ui/separator';

interface ProductFiltersProps {
  filters: ProductFilter;
  onChange: (filters: ProductFilter) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Cuenta filtros activos
 */
const countActiveFilters = (filters: ProductFilter): number => {
  let count = 0;
  if (filters.category) count++;
  return count;
};

/**
 * Componente de filtros de productos
 * Permite filtrar por categoría
 */
const ProductFiltersComponent = ({
  filters,
  onChange,
  onClear,
  disabled = false,
}: ProductFiltersProps) => {
  const [open, setOpen] = useState(false);
  const activeFiltersCount = countActiveFilters(filters);

  // Estado local para inputs de rango
  const [localFilters, setLocalFilters] = useState<ProductFilter>(filters);

  const handleApplyFilters = () => {
    onChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClear();
    setOpen(false);
  };

  const updateLocalFilter = <K extends keyof ProductFilter>(
    key: K,
    value: ProductFilter[K]
  ) => {
    setLocalFilters((prev: ProductFilter) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} className="relative">
          <Filter className="mr-2 h-4 w-4" />

          Filtros
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filtros de productos</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-auto p-1 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>

          <Separator />

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-medium">
              Categoría
            </Label>
            <Input
              id="category"
              placeholder="Ej: Electrónicos, Alimentos..."
              value={localFilters.category || ''}
              onChange={(e) => updateLocalFilter('category', e.target.value || undefined)}
            />
          </div>

          <Separator />

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleApplyFilters}
              className="flex-1"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

ProductFiltersComponent.displayName = 'ProductFilters';

export const ProductFilters = memo(ProductFiltersComponent);
