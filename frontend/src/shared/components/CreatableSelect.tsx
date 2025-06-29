import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useKeyboardNavigation } from "@/shared/hooks/useKeyboardNavigation";

interface CreatableSelectProps<T> {
  label: string;
  values: T[];
  selectedValue?: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  searchFunction: (query: string) => Promise<T[]>;
  onAddValue?: (name: string) => Promise<T>;
  displayField: keyof T; // Campo que se mostrará (ej: 'name', 'tradeName', etc.)
  valueField: keyof T; // Campo único para identificar (ej: 'id')
  disabled?: boolean; // Si se quiere deshabilitar el select
  hideLabel?: boolean; // Si se quiere ocultar la etiqueta
}

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const CreatableSelect = <T,>({
  label,
  values,
  selectedValue,
  onChange,
  placeholder,
  searchFunction,
  onAddValue,
  displayField,
  valueField,
  disabled = false,
  hideLabel = false,
}: CreatableSelectProps<T>) => {
  const [search, setSearch] = useState("");
  const [filteredValues, setFilteredValues] = useState<T[]>(values);
  const [isSearching, setIsSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll hacia el elemento destacado
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  // Debounce del search para evitar muchas peticiones
  const debouncedSearch = useDebounce(search, 300);

  // Memoizar valores calculados
  const displayText = useMemo(() => 
    selectedValue ? String(selectedValue[displayField]) : "", 
    [selectedValue, displayField]
  );

  const exactMatch = useMemo(() => 
    filteredValues.some(
      (item) => String(item[displayField]).toLowerCase() === search.toLowerCase()
    ), 
    [filteredValues, search, displayField]
  );

  // Búsqueda optimizada con debounce
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch.trim()) {
        setFilteredValues(values);
        setHighlightedIndex(-1);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchFunction(debouncedSearch);
        setFilteredValues(results);
        setHighlightedIndex(0); // Auto-highlight primero
      } catch (error) {
        console.error("Error en búsqueda:", error);
        setFilteredValues([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch, values, searchFunction]);

  // Mantener foco en input al filtrar
  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      const input = inputRef.current;
      // Usar setTimeout para asegurar que el re-render termine
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }, 0);
    }
  }, [filteredValues]);

  const handleCreate = useCallback(async () => {
    if (!onAddValue || !search.trim()) return;

    setCreating(true);
    try {
      const newItem = await onAddValue(search.trim());
      onChange(newItem);
      setSearch("");
      setFilteredValues(prev => [...prev, newItem]);
      setOpen(false);
    } catch (error) {
      console.error("Error creando elemento:", error);
      alert("No se pudo crear. Intenta de nuevo.");
    } finally {
      setCreating(false);
    }
  }, [onAddValue, search, onChange]);

  const handleSelect = useCallback((item: T) => {
    onChange(item);
    setSearch("");
    setOpen(false);
  }, [onChange]);

  // Navegación con teclado usando hook personalizado
  const { handleKeyDown } = useKeyboardNavigation({
    open,
    setOpen,
    filteredItems: filteredValues,
    highlightedIndex,
    setHighlightedIndex,
    search,
    setSearch,
    exactMatch,
    onSelect: handleSelect,
    onCreate: handleCreate,
    canCreate: Boolean(onAddValue),
  });

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setHighlightedIndex(-1);
    if (!open) {
      setOpen(true);
    }
  }, [open]);

  // Resetear estado cuando se abre/cierra el popover
  useEffect(() => {
    if (open) {
      // Cuando se abre, resetear búsqueda si hay valor seleccionado
      if (selectedValue && !search) {
        setSearch("");
      }
      setHighlightedIndex(-1);
    } else {
      // Cuando se cierra, limpiar búsqueda
      setSearch("");
      setHighlightedIndex(-1);
    }
  }, [open, selectedValue, search]);

  return (
    <div className="space-y-2">
        {!hideLabel && 
      <label className="text-sm font-medium text-gray-700">{label}</label>
        }
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            className="w-full justify-between"
            disabled={disabled}
            onClick={() => !disabled && setOpen(!open)}
          >
            <span className="truncate text-left">
              {displayText || placeholder || `Seleccionar ${label.toLowerCase()}`}
            </span>
            <ChevronDown className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          {disabled ? (
            <div className="p-2">
              <div className="px-2 py-1.5 text-sm">
                {displayText}
              </div>
            </div>
          ) : (
            <>
              <div className="p-2">
                <Input
                  ref={inputRef}
                  placeholder={`Buscar ${label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8"
                  autoFocus
                />
              </div>
              {isSearching ? (
                <div className="p-2 text-center text-gray-500 text-sm">
                  Buscando...
                </div>
              ) : (
                <div ref={listRef} className="max-h-[200px] overflow-auto">
                  {filteredValues.map((item, index) => (
                    <button
                      key={String(item[valueField])}
                      className={`w-full px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
                        highlightedIndex === index ? "bg-accent text-accent-foreground" : ""
                      } ${
                        selectedValue && String(selectedValue[valueField]) === String(item[valueField])
                          ? "bg-accent/50"
                          : ""
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      {selectedValue && String(selectedValue[valueField]) === String(item[valueField]) && (
                        <Check className="h-4 w-4" />
                      )}
                      <span className="flex-1 truncate">
                        {String(item[displayField])}
                      </span>
                    </button>
                  ))}
                  {search && !exactMatch && onAddValue && (
                    <div className="p-2 border-t">
                      <Button
                        type="button"
                        onClick={handleCreate}
                        className="w-full text-sm h-8"
                        disabled={creating}
                        variant="ghost"
                      >
                        {creating ? "Creando..." : `+ Crear "${search}"`}
                      </Button>
                    </div>
                  )}
                  {filteredValues.length === 0 && !search && (
                    <div className="p-2 text-center text-gray-500 text-sm">
                      No hay opciones disponibles
                    </div>
                  )}
                  {filteredValues.length === 0 && search && !isSearching && (
                    <div className="p-2 text-center text-gray-500 text-sm">
                      No se encontraron resultados
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CreatableSelect;
