import { useCallback, memo } from 'react';
import { Warehouse } from 'lucide-react';
import { AddMedicationDialog } from './AddMedicationDialog';
import { MedicationSearch } from './MedicationSearch';
import { MedicationFilters } from './MedicationFilters';
import { MedicationTable } from './MedicationTable';
import { DataPagination } from '@/shared/components/DataPagination';
import { useMedicationCatalog } from '../hooks/useMedicationCatalog';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

const InventoryPageComponent = () => {
  const {
    medications,
    loading,
    error,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchQuery,
    filters,
    sort,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
    setSort,
    clearFilters,
    refresh
  } = useMedicationCatalog({
    initialPageSize: 10
  });

  const handleMedicationAdded = useCallback(() => {
    console.log('Medicamento agregado exitosamente - refrescando lista');
    void refresh();
  }, [refresh]);

  const handleRowClick = useCallback((medication: MedicationCatalogView) => {
    console.log('Clicked medication:', medication.id);
    // TODO: Abrir modal de detalles o navegar a página de detalles
  }, []);

  if (error) {
    // Si es error de inicialización, mostrar estado de carga
    if (error.includes('Inicializando base de datos')) {
      return (
        <div className="p-4 lg:p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <h3 className="text-blue-800 font-medium">Inicializando aplicación</h3>
            </div>
            <p className="text-blue-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error al cargar medicamentos</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={refresh}
            className="mt-2 text-red-700 underline text-sm hover:text-red-800"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg self-center mt-1">
            <Warehouse className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
          </div>
          <div>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Inventario</p>
            <p className="text-gray-500 text-sm sm:text-gray-600">Gestión de medicamentos y control de stock</p>
          </div>
        </div>
        <AddMedicationDialog onMedicationAdded={handleMedicationAdded} />
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <MedicationSearch
          value={searchQuery}
          onChange={setSearch}
          disabled={loading}
        />
        <MedicationFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          disabled={loading}
        />
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {loading ? (
            <span>Cargando medicamentos...</span>
          ) : (
            <span>
              Mostrando {medications.length} de {totalItems} medicamentos
              {searchQuery && ` para "${searchQuery}"`}
            </span>
          )}
        </div>
        {!loading && totalItems > 0 && (
          <div>
            Página {currentPage} de {totalPages}
          </div>
        )}
      </div>
      
      {/* Table */}
      <div>
        {/* Desktop/Tablet container */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border">
          <MedicationTable
            medications={medications}
            loading={loading}
            sort={sort}
            onSort={setSort}
            onRowClick={handleRowClick}
          />
        </div>
        
        {/* Mobile view - no container */}
        <div className="md:hidden">
          <MedicationTable
            medications={medications}
            loading={loading}
            sort={sort}
            onSort={setSort}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <div className="w-full">
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={setPage}
            onItemsPerPageChange={setPageSize}
            startIndex={(currentPage - 1) * pageSize + 1}
            endIndex={Math.min(currentPage * pageSize, totalItems)}
            itemName="medicamentos"
          />
        </div>
      )}
    </div>
  );
};

export const InventoryPage = memo(InventoryPageComponent);
