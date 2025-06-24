import React, { useState, useEffect, useMemo } from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { DataPagination } from '../../../shared/components/DataPagination';
import { BatchSearchAndFilters } from './BatchSearchAndFilters';
import { BatchTable } from './BatchTable';
import { BatchDialog } from './BatchDialog';
import type { Medication } from '../../../shared/types/Medication';
import type { BatchWithMedication, BatchFilter } from '../../../shared/types/Sales';

// Mock data - In real implementation, this would come from API/database
const mockMedications: Medication[] = [
  {
    id: '1',
    tradeName: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    activeIngredientIds: ['1'],
    pharmaceuticalFormId: '1',
    concentration: '500mg',
    presentation: 'Caja x 20 tabletas',
    manufacturerId: '1',
    categoryId: '1',
    batches: [],
    totalStock: 0
  },
  {
    id: '2',
    tradeName: 'Ibuprofeno 400mg',
    genericName: 'Ibuprofeno',
    activeIngredientIds: ['2'],
    pharmaceuticalFormId: '1',
    concentration: '400mg',
    presentation: 'Caja x 30 tabletas',
    manufacturerId: '2',
    categoryId: '1',
    batches: [],
    totalStock: 0
  }
];

const mockBatches: BatchWithMedication[] = [
  {
    batchId: 'LOT001',
    expirationDate: '2025-12-31',
    quantity: 100,
    purchasePrice: 10.50,
    sellingPrice: 13.65,
    purchaseDate: '2024-01-15',
    supplier: 'Farmacéutica ABC',
    createdAt: '2024-01-15T10:00:00Z',
    createdBy: 'user1',
    medication: {
      id: '1',
      tradeName: 'Paracetamol 500mg',
      genericName: 'Paracetamol',
      concentration: '500mg',
      presentation: 'Caja x 20 tabletas'
    }
  },
  {
    batchId: 'LOT002',
    expirationDate: '2024-08-30',
    quantity: 50,
    purchasePrice: 15.00,
    sellingPrice: 19.50,
    purchaseDate: '2024-02-01',
    supplier: 'Laboratorios XYZ',
    createdAt: '2024-02-01T14:30:00Z',
    createdBy: 'user1',
    medication: {
      id: '2',
      tradeName: 'Ibuprofeno 400mg',
      genericName: 'Ibuprofeno',
      concentration: '400mg',
      presentation: 'Caja x 30 tabletas'
    }
  }
];

export const BatchManager: React.FC = () => {
  const [batches, setBatches] = useState<BatchWithMedication[]>(mockBatches);
  const [medications] = useState<Medication[]>(mockMedications);
  const [loading, setLoading] = useState(false);

  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<BatchFilter>({});

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [batchesPerPage, setBatchesPerPage] = useState(10);

  // Estados para selección
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  // Estados para diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingBatch, setEditingBatch] = useState<BatchWithMedication | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Load real data from API
      // For now, we're using mock data
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar lotes basado en búsqueda y filtros
  const filteredBatches = useMemo(() => {
    let filtered = batches;

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(batch =>
        batch.medication.tradeName.toLowerCase().includes(query) ||
        batch.medication.genericName.toLowerCase().includes(query) ||
        batch.batchId.toLowerCase().includes(query) ||
        batch.supplier?.toLowerCase().includes(query)
      );
    }

    // Aplicar filtros de fecha
    if (dateFilter.dateFrom) {
      filtered = filtered.filter(batch => {
        const purchaseDate = batch.purchaseDate || batch.createdAt;
        return purchaseDate && purchaseDate >= dateFilter.dateFrom!;
      });
    }

    if (dateFilter.dateTo) {
      filtered = filtered.filter(batch => {
        const purchaseDate = batch.purchaseDate || batch.createdAt;
        return purchaseDate && purchaseDate <= dateFilter.dateTo!;
      });
    }

    // Aplicar filtro de medicamento
    if (dateFilter.medicationId) {
      filtered = filtered.filter(batch => batch.medication.id === dateFilter.medicationId);
    }

    return filtered;
  }, [batches, searchQuery, dateFilter]);

  // Calcular lotes para la página actual
  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * batchesPerPage;
    const endIndex = startIndex + batchesPerPage;
    return filteredBatches.slice(startIndex, endIndex);
  }, [filteredBatches, currentPage, batchesPerPage]);

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedBatches([]);
  };

  // Manejar búsqueda
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setSelectedBatches([]);
  };

  // Manejar filtros de fecha
  const handleDateFilterChange = (filter: BatchFilter) => {
    setDateFilter(filter);
    setCurrentPage(1);
    setSelectedBatches([]);
  };

  // Manejar selección de lotes
  const handleSelectBatch = (batchId: string) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBatches(paginatedBatches.map(batch => batch.batchId));
    } else {
      setSelectedBatches([]);
    }
  };

  // Manejar diálogos
  const handleNewBatch = () => {
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
    if (window.confirm(`¿Estás seguro de que quieres eliminar el lote ${batch.batchId}?`)) {
      try {
        // TODO: Implement actual deletion
        setBatches(prev => prev.filter(b => b.batchId !== batch.batchId));
        console.log(`Lote ${batch.batchId} eliminado`);
      } catch (error) {
        console.error('Error deleting batch:', error);
      }
    }
  };

  const handleDialogSuccess = () => {
    loadData();
  };

  // Calcular información de paginación
  const totalPages = Math.ceil(filteredBatches.length / batchesPerPage);
  const startIndex = (currentPage - 1) * batchesPerPage;
  const endIndex = Math.min(startIndex + batchesPerPage, filteredBatches.length);

  // Calcular estadísticas
  const totalBatches = batches.length;
  const totalValue = batches.reduce((sum, batch) => sum + (batch.quantity * batch.purchasePrice), 0);
  const averageMargin = batches.length > 0 
    ? batches.reduce((sum, batch) => {
        const margin = batch.purchasePrice > 0 
          ? ((batch.sellingPrice - batch.purchasePrice) / batch.purchasePrice) * 100 
          : 0;
        return sum + margin;
      }, 0) / batches.length 
    : 0;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h1>
        </div>
        <p className="text-gray-600">Administra los lotes de medicamentos y sus precios</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Lotes</p>
                <p className="text-2xl font-bold">{totalBatches}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total de Inventario</p>
                <p className="text-2xl font-bold">
                  Bs. {totalValue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Margen Promedio</p>
                <p className="text-2xl font-bold">{averageMargin.toFixed(1)}%</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <div className="mb-6">
        <BatchSearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          dateFilter={dateFilter}
          onDateFilterChange={handleDateFilterChange}
          onNewBatch={handleNewBatch}
          medications={medications}
          totalBatches={filteredBatches.length}
        />
      </div>

      {/* Tabla de lotes */}
      <div className="mb-4">
        <BatchTable
          batches={paginatedBatches}
          selectedBatches={selectedBatches}
          onSelectBatch={handleSelectBatch}
          onSelectAll={handleSelectAll}
          onEditBatch={handleEditBatch}
          onDeleteBatch={handleDeleteBatch}
          loading={loading}
        />
      </div>

      {/* Paginación */}
      {filteredBatches.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBatches.length}
          itemsPerPage={batchesPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(newBatchesPerPage) => {
            setBatchesPerPage(newBatchesPerPage);
            setCurrentPage(1);
          }}
          startIndex={startIndex}
          endIndex={endIndex}
          itemName="lotes"
        />
      )}

      {/* Diálogo de crear/editar lote */}
      <BatchDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        batch={editingBatch}
        mode={dialogMode}
        medications={medications}
      />
    </div>
  );
};
