import { useState, useCallback } from "react";
import { Button } from "@/shared/components/ui/button.tsx";
import { Input } from "@/shared/components/ui/input.tsx";
import { BriefcaseMedical, Search } from "lucide-react";
import NewSaleDialog from "./NewSaleDialog.tsx";
import SalesFilters from "./SalesFilters";
import SalesTable from "./SalesTable";
import { DataPagination } from "@/shared/components/DataPagination";
import { useSalesSearch } from "../hooks/useSalesSearch";

export const SalesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const {
    sales,
    isLoading,
    error,
    pagination,
    filters,
    setSearchQuery,
    setDateRange,
    clearFilters,
    changePage,
    changeItemsPerPage,
    refetch
  } = useSalesSearch(300);

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  // Manejar cambio de rango de fechas
  const handleDateRangeChange = useCallback((dateFrom?: string, dateTo?: string) => {
    setDateRange(dateFrom, dateTo);
  }, [setDateRange]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg self-center mt-1">
              <BriefcaseMedical className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Ventas
              </p>
              <p className="text-gray-500 text-sm sm:text-gray-600">
                Registra una nueva venta o consulta las ventas registradas
              </p>
            </div>
          </div>
        </div>

        {/* Búsqueda y Acciones */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente, método de pago, vendedor..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="pl-10 border-gray-300"
            />
          </div>
          <div>
            <Button variant="default" onClick={() => setDialogOpen(true)}>
              Nueva venta
            </Button>
          </div>
        </div>

        {/* Filtros de fecha */}
        <SalesFilters
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={clearFilters}
        />

        {/* Tabla de ventas */}
        <SalesTable
          sales={sales}
          isLoading={isLoading}
          error={error}
        />

        {/* Paginación */}
        {!isLoading && sales.length > 0 && (
          <DataPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={changePage}
            onItemsPerPageChange={changeItemsPerPage}
            startIndex={(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
            endIndex={Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
            itemName="ventas"
          />
        )}
      </div>

      {/* Diálogo de nueva venta */}
      <NewSaleDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSaleSuccess={refetch}
      />
    </div>
  );
};
