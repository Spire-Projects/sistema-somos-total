import React, { useState, useEffect } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { DataPagination } from '../../../shared/components/DataPagination';
import { MedicationAccordionTable } from './MedicationAccordionTable';
import type { Medication } from '../../../shared/types/Medication';
import type { BatchWithMedication } from '../../../shared/types/Sales';
import { findAllMedicationsPaginated } from '../../../shared/services/MedicationService';
import BatchDialog from './BatchDialog/BatchDialog';

export const BatchManager: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para paginación de medicamentos
  const [currentPage, setCurrentPage] = useState(1);
  const [medicationsPerPage, setMedicationsPerPage] = useState(10);
  const [totalMedications, setTotalMedications] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estados para diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingBatch, setEditingBatch] = useState<BatchWithMedication | null>(null);

  useEffect(() => {
    loadMedications();
  }, [currentPage, medicationsPerPage]);

  const loadMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await findAllMedicationsPaginated(currentPage, medicationsPerPage);
      setMedications(response.items);
      setTotalMedications(response.totalItems);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading medications:', error);
      setError('Error cargando los medicamentos');
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

  // Manejar diálogos
  const handleCreateBatch = (_medicationId: string) => {
    // TODO: Preseleccionar el medicamento en el diálogo
    setDialogMode('create');
    setEditingBatch(null);
    setDialogOpen(true);
  };

  const handleEditBatch = (batch: BatchWithMedication) => {
    setDialogMode('edit');
    setEditingBatch(batch);
    setDialogOpen(true);
  };

  const handleDeleteBatch = async (batch: BatchWithMedication) => {
    // TODO: Implementar eliminación de lote
    console.log('Delete batch:', batch);
  };

  const handleDialogSuccess = () => {
    loadMedications();
  };

  // Calcular información de paginación
  const startIndex = (currentPage - 1) * medicationsPerPage;
  const endIndex = Math.min(startIndex + medicationsPerPage, totalMedications);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h1>
            <p className="text-gray-600">
              Administra los lotes de medicamentos y su información
            </p>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            onClick={loadMedications}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Medicamentos</p>
                <p className="text-2xl font-bold text-gray-900">{totalMedications}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lotes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medications.reduce((total, med) => total + med.batches.length, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medications.reduce((total, med) => total + med.totalStock, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximos a Vencer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medications.reduce((count, med) => {
                    const today = new Date();
                    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
                    return count + med.batches.filter(batch => 
                      new Date(batch.expirationDate) <= thirtyDaysFromNow
                    ).length;
                  }, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de medicamentos con acordeón */}
      <MedicationAccordionTable
        medications={medications}
        onEditBatch={handleEditBatch}
        onDeleteBatch={handleDeleteBatch}
        onCreateBatch={handleCreateBatch}
        loading={loading}
      />

      {/* Paginación */}
      {totalPages > 1 && (
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
      )}

      {/* Diálogo de lote */}
      <BatchDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        batch={editingBatch}
        mode={dialogMode}
      />
    </div>
  );
};
