import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Filter } from 'lucide-react';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Card, CardContent } from '../../../shared/components/ui/card';
import type { Medication } from '../../../shared/types/Medication';
import type { BatchFilter } from '../../../shared/types/Sales';

interface BatchSearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilter: BatchFilter;
  onDateFilterChange: (filter: BatchFilter) => void;
  onNewBatch: () => void;
  medications: Medication[];
  totalBatches: number;
}

export const BatchSearchAndFilters: React.FC<BatchSearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  onNewBatch,
  medications,
  totalBatches
}) => {
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // setIsMobile(window.innerWidth < 768); // Reserved for future mobile-specific features
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDateFromChange = (value: string) => {
    onDateFilterChange({
      ...dateFilter,
      dateFrom: value || undefined
    });
  };

  const handleDateToChange = (value: string) => {
    onDateFilterChange({
      ...dateFilter,
      dateTo: value || undefined
    });
  };

  const handleMedicationChange = (value: string) => {
    onDateFilterChange({
      ...dateFilter,
      medicationId: value === 'all' ? undefined : value
    });
  };

  const clearFilters = () => {
    onDateFilterChange({});
    onSearchChange('');
  };

  const hasActiveFilters = dateFilter.dateFrom || dateFilter.dateTo || dateFilter.medicationId;

  return (
    <div className="space-y-4">
      {/* Barra principal de búsqueda y acciones */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por medicamento, lote ID o proveedor..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                    {[dateFilter.dateFrom, dateFilter.dateTo, dateFilter.medicationId].filter(Boolean).length}
                  </span>
                )}
              </Button>
              
              <Button onClick={onNewBatch} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Lote
              </Button>
            </div>
          </div>

          {/* Información de resultados */}
          <div className="mt-3 text-sm text-gray-600">
            {totalBatches} lote{totalBatches !== 1 ? 's' : ''} encontrado{totalBatches !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro de fecha desde */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fecha desde
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={dateFilter.dateFrom || ''}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro de fecha hasta */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fecha hasta
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={dateFilter.dateTo || ''}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro de medicamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Medicamento
                </label>
                <Select 
                  value={dateFilter.medicationId || 'all'}
                  onValueChange={handleMedicationChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los medicamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los medicamentos</SelectItem>
                    {medications.map((medication) => (
                      <SelectItem key={medication.id} value={medication.id}>
                        {medication.tradeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botón de limpiar filtros */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 invisible">
                  Acciones
                </label>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
