import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { cn } from '../../../lib/utils';

export type UserFilter = 'all' | 'admin' | 'cashier' | 'warehouse' | 'vendor' | 'accounting';

interface UserSearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: UserFilter;
  onFilterChange: (filter: UserFilter) => void;
  onNewUser: () => void;
  userCounts: Record<UserFilter, number>;
}

export const UserSearchAndFilters: React.FC<UserSearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onNewUser,
  userCounts
}) => {
  // Estado para el tamaño de la pantalla
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Efecto para detectar el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 768);
    };
    
    // Inicializar
    handleResize();
    
    // Agregar listener
    window.addEventListener('resize', handleResize);
    
    // Limpiar listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterOptions = [
    { value: 'all', label: 'Todos', count: userCounts.all },
    { value: 'admin', label: 'Administradores', count: userCounts.admin },
    { value: 'cashier', label: 'Caja', count: userCounts.cashier },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y acciones principales */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Campo de búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, correo, rol..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            onClick={onNewUser}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
          
          {/* Botón de filtros para móvil - opcional */}
          <Button variant="outline" className="sm:hidden">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs de filtros personalizados - Visibles en desktop */}
      <div className={cn("overflow-x-auto py-1", isMobile ? "hidden" : "block")}>
        <div className="flex gap-2 md:gap-3">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value as UserFilter)}
              className={cn(
                "px-4 py-2 text-sm rounded-full border border-gray-300 transition-all whitespace-nowrap flex items-center",
                activeFilter === option.value
                  ? "bg-green-500 text-white border-green-500 font-medium"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              <span>
                {isTablet && option.label.length > 10
                  ? option.label.split(' ')[0]
                  : option.label}
              </span>
              {option.count > 0 && (
                <span className={cn(
                  "ml-1.5 text-xs px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[20px]",
                  activeFilter === option.value
                    ? "bg-white text-green-700"
                    : "bg-gray-200 text-gray-700"
                )}>
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Select para filtros en móvil */}
      <div className={isMobile ? "block" : "hidden"}>
        <Select value={activeFilter} onValueChange={(value) => onFilterChange(value as UserFilter)}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Seleccionar filtro" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} {option.count > 0 && `(${option.count})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
