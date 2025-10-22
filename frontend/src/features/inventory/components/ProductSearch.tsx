import { memo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Componente de búsqueda de productos
 * Incluye campo de búsqueda con icono y botón de limpiar
 */
const ProductSearchComponent = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Buscar por código o nombre...',
}: ProductSearchProps) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pl-9 pr-9"
      />
      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          <span className="sr-only">Limpiar búsqueda</span>
        </Button>
      )}
    </div>
  );
};

ProductSearchComponent.displayName = 'ProductSearch';

export const ProductSearch = memo(ProductSearchComponent);
