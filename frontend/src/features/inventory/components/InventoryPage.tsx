import { useCallback, memo } from "react";
import { Warehouse, Download } from "lucide-react";
import { MedicationSearch } from "./MedicationSearch";
import { MedicationFilters } from "./MedicationFilters";
import { MedicationTable } from "./MedicationTable";
import { DataPagination } from "@/shared/components/DataPagination";
import { ExportModal } from "@/shared/components/ExportModal";
import { useMedicationCatalog } from "../hooks/useMedicationCatalog";
import { useExcelExport } from "@/shared/hooks/useExcelExport";
import { ExcelExporter } from "@/shared/utils/excel.utils";
import type { MedicationCatalogView } from "@/shared/types/MedicationViewTypes";
import type { ExportFieldConfig } from "@/shared/types/ExportTypes";
import { Button } from "@/shared/components/ui/button";
import { getMedicationCatalogExport } from "@/shared/services/MedicationService";

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
    refresh,
  } = useMedicationCatalog({
    initialPageSize: 10,
  });

  // Configuración de campos disponibles para exportación
  const exportFields: ExportFieldConfig<MedicationCatalogView>[] = [
    { key: 'comercialName', label: 'Nombre Comercial', selected: true },
    { key: 'tradeName', label: 'Nombre de Marca', selected: true },
    { key: 'genericName', label: 'Nombre Genérico', selected: true },
    { key: 'manufacturerName', label: 'Fabricante', selected: true },
    { key: 'categoryName', label: 'Categoría', selected: true },
    { key: 'pharmaceuticalFormName', label: 'Forma Farmacéutica', selected: true },
    { key: 'concentration', label: 'Concentración', selected: true },
    { key: 'presentation', label: 'Presentación', selected: true },
    { key: 'totalActiveStock', label: 'Stock Total', selected: true },
    { key: 'activeBatchCount', label: 'Lotes Activos', selected: true },
    { key: 'stockStatus', label: 'Estado de Stock', selected: false, format: (value) => ExcelExporter.translateValue('stockStatus', value) },
    { key: 'barcode', label: 'Código de Barras', selected: false },
    { key: 'createdAt', label: 'Fecha de Creación', selected: false, format: (value) => new Date(value).toLocaleDateString() },
  ];

  // Hook para exportación
  const {
    isExporting,
    isModalOpen,
    openExportModal,
    closeExportModal,
    handleExport
  } = useExcelExport({
    title: 'Catálogo de Medicamentos',
    dataExtractor: getMedicationCatalogExport,
    defaultFields: exportFields,
    fileName: 'catalogo_medicamentos',
    getAdditionalMetadata: () => ({
      searchQuery,
      ...filters
    })
  });

  const handleMedicationAdded = useCallback(() => {
    void refresh();
  }, [refresh]);

  const handleRowClick = useCallback((medication: MedicationCatalogView) => {
    console.log("Clicked medication:", medication.id);
    // TODO: Abrir modal de detalles o navegar a página de detalles
  }, []);

  if (error) {
    // Si es error de inicialización, mostrar estado de carga
    if (error.includes("Inicializando base de datos")) {
      return (
        <div className="p-4 lg:p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <h3 className="text-blue-800 font-medium">
                Inicializando aplicación
              </h3>
            </div>
            <p className="text-blue-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">
            Error al cargar medicamentos
          </h3>
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
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Inventario
            </p>
            <p className="text-gray-500 text-sm sm:text-gray-600">
              Gestión de productos y control de stock
            </p>
          </div>
        </div>
     
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
        <Button 
          variant={"outline"}
          size="sm"
          onClick={openExportModal}
          disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Inventario
          </Button>
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
          
        </div>

        {/* Mobile view - no container */}
        <div className="md:hidden">
          
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

      {/* Modal de Exportación */}
      <ExportModal<MedicationCatalogView>
        open={isModalOpen}
        onOpenChange={closeExportModal}
        title="Inventario de Medicamentos"
        fields={exportFields}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
};

export const InventoryPage = memo(InventoryPageComponent);
