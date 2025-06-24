import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  startIndex: number;
  endIndex: number;
  itemName: string; // e.g., "usuarios", "lotes"
}

export const DataPagination: React.FC<DataPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  startIndex,
  endIndex,
  itemName
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const sidePages = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - sidePages);
      let endPage = Math.min(totalPages, currentPage + sidePages);
      
      if (currentPage <= sidePages) {
        endPage = maxVisiblePages;
      }
      
      if (currentPage >= totalPages - sidePages) {
        startPage = totalPages - maxVisiblePages + 1;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t">
      {/* Información de resultados */}
      <div className="text-sm text-gray-700">
        Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} {itemName}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Selector de elementos por página - Solo en desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-gray-700">Mostrar:</span>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value: string) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navegación de páginas */}
        <div className="flex items-center gap-1">
          {/* Botón anterior */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Números de página */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Primera página con separador si es necesario */}
            {visiblePages[0] > 1 && (
              <>
                <Button
                  variant={1 === currentPage ? "default" : "outline"}
                  size="icon"
                  onClick={() => onPageChange(1)}
                  className="h-8 w-8"
                >
                  1
                </Button>
                {visiblePages[0] > 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
              </>
            )}

            {/* Páginas visibles */}
            {visiblePages.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(page)}
                className="h-8 w-8"
              >
                {page}
              </Button>
            ))}

            {/* Última página con separador si es necesario */}
            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                <Button
                  variant={totalPages === currentPage ? "default" : "outline"}
                  size="icon"
                  onClick={() => onPageChange(totalPages)}
                  className="h-8 w-8"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Solo página actual en mobile */}
          <div className="sm:hidden flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
          </div>

          {/* Botón siguiente */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selector móvil de elementos por página */}
      <div className="sm:hidden w-full">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-700">Mostrar:</span>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value: string) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">{itemName} por página</span>
        </div>
      </div>
    </div>
  );
};
