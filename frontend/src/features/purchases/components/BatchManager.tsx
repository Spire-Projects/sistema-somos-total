import React, { useState, useEffect } from "react";
import { Package, Plus, Clock, X } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { DataPagination } from "@/shared/components/DataPagination";
import { MedicationAccordionTable } from "./MedicationAccordionTable";
import { BatchStatsCards } from "./BatchStatsCards";
import { MedicationBatchSearch } from "./MedicationBatchSearch";
import CustomDialog from "@/shared/components/CustomDialog";
import type { MedicationWithBatches } from "@/shared/types/Medication";
import type { BatchWithMedication } from "@/shared/types/Sales";
import {
  getMedicationsWithBatchesPaginated,
  deleteMedicationBatch,
  searchMedicationsWithBatchesCombined,
  getMedicationsWithExpiringBatches,
} from "@/shared/services/MedicationBatchService";
import BatchDialog from "./BatchDialog/BatchDialog";

export const BatchManager: React.FC = () => {
  const [medications, setMedications] = useState<MedicationWithBatches[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  // 🆕 Estado para filtro de próximos a vencer
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  // Estados para paginación de medicamentos
  const [currentPage, setCurrentPage] = useState(1);
  const [medicationsPerPage, setMedicationsPerPage] = useState(10);
  const [totalMedications, setTotalMedications] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estados para diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingBatch, setEditingBatch] = useState<BatchWithMedication | null>(
    null
  );
  const [preselectedMedicationId, setPreselectedMedicationId] = useState<string | null>(null);

  // Estados para diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<BatchWithMedication | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMedications();
  }, [currentPage, medicationsPerPage, searchQuery, showExpiringOnly]);

  const loadMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      if (showExpiringOnly) {
        // 🆕 Filtro de próximos a vencer activado - ignora búsqueda
        response = await getMedicationsWithExpiringBatches(
          currentPage,
          medicationsPerPage
        );
      } else if (searchQuery.trim()) {
        // Búsqueda normal
        response = await searchMedicationsWithBatchesCombined(
          searchQuery,
          currentPage,
          medicationsPerPage
        );
      } else {
        // Vista normal - todos los medicamentos
        response = await getMedicationsWithBatchesPaginated(
          currentPage,
          medicationsPerPage
        );
      }

      setMedications(response.items);
      setTotalMedications(response.totalItems);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading medications with batches:", error);
      setError("Error cargando los medicamentos con lotes");
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Manejar cambio de medicamentos por página
  const handleMedicationsPerPageChange = (newMedicationsPerPage: number) => {
    setMedicationsPerPage(newMedicationsPerPage);
    setCurrentPage(1);
  };

  // Manejar cambio de búsqueda
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Manejar diálogos
  const handleCreateBatch = (medicationId: string) => {
    setDialogMode("create");
    setEditingBatch(null);
    setPreselectedMedicationId(medicationId || null); // Si medicationId es "" será null
    setDialogOpen(true);
  };

  const handleEditBatch = (batch: BatchWithMedication) => {
    setDialogMode("edit");
    setEditingBatch(batch);
    setDialogOpen(true);
  };

  const handleDeleteBatch = async (batch: BatchWithMedication) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;

    setDeleting(true);
    try {
      await deleteMedicationBatch(batchToDelete.id);
      console.log("Lote eliminado correctamente:", batchToDelete.batchId);
      // Recargar los datos después de eliminar
      loadMedications();
      setDeleteDialogOpen(false);
      setBatchToDelete(null);
    } catch (error) {
      console.error("Error eliminando lote:", error);
      setError("Error eliminando el lote");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteBatch = () => {
    setDeleteDialogOpen(false);
    setBatchToDelete(null);
  };

  const handleDialogSuccess = () => {
    loadMedications();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setPreselectedMedicationId(null); // Limpiar el medicamento preseleccionado
  };

  // 🆕 Manejar filtro de próximos a vencer
  const handleToggleExpiringFilter = () => {
    setShowExpiringOnly(!showExpiringOnly);
    setCurrentPage(1); // Reset a primera página
    setSearchQuery(""); // Limpiar búsqueda cuando se activa filtro
  };

  const clearAllFilters = () => {
    setShowExpiringOnly(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Calcular información de paginación
  const startIndex = (currentPage - 1) * medicationsPerPage;
  const endIndex = Math.min(startIndex + medicationsPerPage, totalMedications);

  return (
     <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Gestión de Lotes
            </p>
            <p className="text-gray-600">
              Administra los lotes de medicamentos y su información
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <Package className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas rápidas */}
      <BatchStatsCards
        medications={medications}
        totalMedications={totalMedications}
      />

      {/* Buscador de medicamentos y lotes */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:max-w-3xl">
            <MedicationBatchSearch
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre de medicamento o ID de lote..."
              disabled={loading || showExpiringOnly}
            />
            {searchQuery && !showExpiringOnly && (
              <div className="text-sm text-gray-600">
                {totalMedications > 0
                  ? `${totalMedications} resultado${
                      totalMedications !== 1 ? "s" : ""
                    } encontrado${totalMedications !== 1 ? "s" : ""}`
                  : "No se encontraron resultados"}
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => handleCreateBatch("")}
            variant="default"
            className="mt-2 sm:mt-0 w-full sm:w-auto bg-primary hover:bg-secondary"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Agregar Lote</span>
          </Button>
        </div>

        {/* 🆕 Filtros adicionales */}
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            onClick={handleToggleExpiringFilter}
            variant={showExpiringOnly ? "default" : "outline"}
            size="sm"
            className={`transition-all ${
              showExpiringOnly 
                ? "bg-orange-600 hover:bg-orange-700 text-white" 
                : "border-orange-600 text-orange-600 hover:bg-orange-50"
            }`}
          >
            <Clock className="h-4 w-4 mr-2" />
            {showExpiringOnly ? "Mostrando próximos a vencer" : "Mostrar próximos a vencer"}
          </Button>

          {(showExpiringOnly || searchQuery) && (
            <>
              <div className="h-4 w-px bg-gray-300" />
              <Button
                onClick={clearAllFilters}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            </>
          )}

          {showExpiringOnly && (
            <div className="text-sm text-orange-600 font-medium">
              {totalMedications > 0
                ? `${totalMedications} medicamento${totalMedications !== 1 ? "s" : ""} con lotes próximos a vencer`
                : "No hay medicamentos con lotes próximos a vencer"}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de medicamentos con acordeón */}
      <MedicationAccordionTable
        medications={medications}
        onEditBatch={handleEditBatch}
        onDeleteBatch={handleDeleteBatch}
        onCreateBatch={handleCreateBatch}
        loading={loading}
      />

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalMedications}
        itemsPerPage={medicationsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleMedicationsPerPageChange}
        startIndex={startIndex}
        endIndex={endIndex}
        itemName="medicamentos"
      />

      {/* Diálogo de lote */}
      <BatchDialog
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        batch={editingBatch}
        mode={dialogMode}
        preselectedMedicationId={preselectedMedicationId}
      />

      {/* Diálogo de confirmación de eliminación */}
      <CustomDialog
        isOpen={deleteDialogOpen}
        onConfirm={confirmDeleteBatch}
        onCancel={cancelDeleteBatch}
        title="Eliminar Lote"
        description={`¿Estás seguro de eliminar el lote ${batchToDelete?.batchId}? Esta acción no se puede deshacer.`}
        textConfirm="Eliminar"
        textCancel="Cancelar"
        loading={deleting}
      />
    </div>
  );
};
