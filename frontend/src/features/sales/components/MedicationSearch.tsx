import { memo, useState, useRef, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { Search, Loader2, Package } from 'lucide-react';
import { useMedicationSearch } from '../hooks/useMedicationSearch';
import MedicationSearchItem from './MedicationSearchItem';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

interface MedicationSearchProps {
  onMedicationSelect: (medication: MedicationCatalogView) => void;
  placeholder?: string;
  className?: string;
}

const MedicationSearch = memo(({ 
  onMedicationSelect, 
  placeholder = "Buscar medicamento por nombre o código de barras...",
  className = ""
}: MedicationSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    medications,
    isLoading,
    error,
    searchQuery,
    setSearchQuery
  } = useMedicationSearch(300); // 300ms debounce

  // Manejar apertura del popover cuando hay texto en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Abrir popover solo si hay texto o si ya está abierto
    if (value.trim() || isOpen) {
      setIsOpen(true);
    }
  };

  // Manejar focus en el input
  const handleInputFocus = () => {
    // Solo abrir si hay contenido en el input o si queremos mostrar el estado inicial
    if (searchQuery.trim() || medications.length > 0) {
      setIsOpen(true);
    }
  };

  // Manejar blur del input - no cerrar inmediatamente para permitir clicks en el popover
  const handleInputBlur = () => {
    // No hacer nada aquí, dejar que el popover maneje su propio estado
  };

  // Cerrar popover cuando se hace clic fuera
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  // Manejar selección de medicamento
  const handleMedicationSelect = (medication: MedicationCatalogView) => {
    onMedicationSelect(medication);
    setIsOpen(false);
    setSearchQuery(''); // Limpiar input después de seleccionar
    inputRef.current?.blur();
  };

  // Manejar teclas del teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Prevenir scroll de la página
      e.preventDefault();
      // Aquí podrías implementar navegación por teclado en los resultados
      setIsOpen(true);
    }
  };

  // Controlar apertura basada en contenido
  useEffect(() => {
    // Solo abrir automáticamente si hay query y resultados, o si está cargando
    if (searchQuery.trim() && (medications.length > 0 || isLoading || error)) {
      setIsOpen(true);
    } else if (!searchQuery.trim()) {
      setIsOpen(false);
    }
  }, [searchQuery, medications.length, isLoading, error]);

  return (
    <div className={`relative ${className}`}>
      <Popover open={isOpen} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-4"
              autoComplete="off"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin pointer-events-none" />
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent 
          className="w-full min-w-[800px] max-w-[900px] p-0" 
          align="start"
          sideOffset={0}
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevenir auto-focus en el popover content
        >
          <div className="max-h-80 overflow-auto">
            {error && (
              <div className="p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}
            
            {!error && !isLoading && searchQuery.trim() && medications.length === 0 && (
              <div className="p-3 text-center text-sm text-gray-500">
                No se encontraron medicamentos
              </div>
            )}
            
            {!error && !isLoading && !searchQuery.trim() && (
              <div className="p-3 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Package className="h-4 w-4" />
                Escribe para buscar medicamentos
              </div>
            )}
            
            {medications.length > 0 && (
              <div>
                {medications.map((medication) => (
                  <MedicationSearchItem
                    key={medication.id}
                    medication={medication}
                    onAddToSale={handleMedicationSelect}
                  />
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="p-3 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-1">Buscando...</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

MedicationSearch.displayName = 'MedicationSearch';

export default MedicationSearch;
