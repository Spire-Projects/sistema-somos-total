import { memo } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent } from '@/shared/components/ui/card';

interface SalesFiltersProps {
  dateFrom?: string;
  dateTo?: string;
  onDateRangeChange: (dateFrom?: string, dateTo?: string) => void;
  onClearFilters: () => void;
}

const SalesFilters = memo(({
  dateFrom,
  dateTo,
  onDateRangeChange,
  onClearFilters
}: SalesFiltersProps) => {
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateFrom = e.target.value || undefined;
    onDateRangeChange(newDateFrom, dateTo);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateTo = e.target.value || undefined;
    onDateRangeChange(dateFrom, newDateTo);
  };

  const hasFilters = dateFrom || dateTo;

  return (
    <Card className='!gap-0'>
      <CardContent className="p-3 pt-0"> 
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            Filtrar por fecha:
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="space-y-1">
              <Label htmlFor="dateFrom" className="text-xs text-gray-600">
                Desde
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom || ''}
                onChange={handleDateFromChange}
                className="w-full sm:w-40"
                max={dateTo} // No permitir fecha desde mayor a fecha hasta
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="dateTo" className="text-xs text-gray-600">
                Hasta
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo || ''}
                onChange={handleDateToChange}
                className="w-full sm:w-40"
                min={dateFrom} // No permitir fecha hasta menor a fecha desde
              />
            </div>
          </div>

          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-3 w-3" />
              Limpiar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SalesFilters.displayName = 'SalesFilters';

export default SalesFilters;
