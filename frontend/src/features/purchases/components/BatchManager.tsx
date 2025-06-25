import React, { useState, useEffect, useMemo } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { DataPagination } from '../../../shared/components/DataPagination';
import { BatchSearchAndFilters } from './BatchSearchAndFilters';
import { BatchTable } from './BatchTable';
import { BatchDialog } from './BatchDialog';
import type { Medication } from '../../../shared/types/Medication';
import type { BatchWithMedication, BatchFilter } from '../../../shared/types/Sales';
import { BatchService } from '../../../shared/services/BatchService';

export const BatchManager: React.FC = () => {
  const [batches, setBatches] = useState<BatchWithMedication[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      // Cargar medicamentos y lotes en paralelo
      const [batchesResult, medicationsResult] = await Promise.all([
        BatchService.getAllBatches(),
        BatchService.getMedicationsForSelector()
      ]);

      if (batchesResult.success && batchesResult.data) {
        setBatches(batchesResult.data);
      } else {
        setError(batchesResult.error || 'Error cargando lotes');
      }

      if (medicationsResult.success && medicationsResult.data) {
        setMedications(medicationsResult.data);
      } else {
        console.warn('Error cargando medicamentos:', medicationsResult.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error cargando los datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar lotes basado en búsqueda y filtros - optimizado para datos reales
  const filteredBatches = useMemo(() => {
    if (batches.length === 0) return [];

    let filtered = [...batches]; // Crear una copia para evitar mutaciones

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
        return purchaseDate && new Date(purchaseDate) >= new Date(dateFilter.dateFrom!);
      });
    }

    if (dateFilter.dateTo) {
      filtered = filtered.filter(batch => {
        const purchaseDate = batch.purchaseDate || batch.createdAt;
        return purchaseDate && new Date(purchaseDate) <= new Date(dateFilter.dateTo!);
      });
    }

    // Aplicar filtro de medicamento
    if (dateFilter.medicationId) {
      filtered = filtered.filter(batch => batch.medication.id === dateFilter.medicationId);
    }

    // Ordenar por fecha de creación (más recientes primero)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || new Date());
      const dateB = new Date(b.createdAt || new Date());
      return dateB.getTime() - dateA.getTime();
    });

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
        setLoading(true);
        const result = await BatchService.deleteBatch(batch.medication.id, batch.batchId);
        
        if (result.success) {
          // Actualizar el estado local removiendo el lote eliminado
          setBatches(prev => prev.filter(b => 
            !(b.batchId === batch.batchId && b.medication.id === batch.medication.id)
          ));
          console.log(`Lote ${batch.batchId} eliminado exitosamente`);
        } else {
          console.error('Error deleting batch:', result.error);
          setError(result.error || 'Error eliminando el lote');
        }
      } catch (error) {
        console.error('Error deleting batch:', error);
        setError('Error eliminando el lote');
      } finally {
        setLoading(false);
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

  // Calcular estadísticas usando los datos reales
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalValue: 0,
    averageMargin: 0,
    expiringBatches: 0
  });

  // Actualizar estadísticas cuando cambien los lotes
  useEffect(() => {
    const calculateStats = async () => {
      try {
        const statsResult = await BatchService.getBatchStats();
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      } catch (error) {
        console.error('Error calculating stats:', error);
      }
    };

    if (batches.length > 0) {
      calculateStats();
    }
  }, [batches]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h1>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        <p className="text-gray-600">Administra los lotes de medicamentos y sus precios</p>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Lotes</p>
                <p className="text-2xl font-bold">{stats.totalBatches}</p>
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
                  Bs. {stats.totalValue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
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
                <p className="text-2xl font-bold">{stats.averageMargin.toFixed(1)}%</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Próximos a Vencer</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiringBatches}</p>
                <p className="text-xs text-gray-500">Próximos 30 días</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
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
        {loading && batches.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Cargando lotes...</div>
          </div>
        ) : (
          <BatchTable
            batches={paginatedBatches}
            selectedBatches={selectedBatches}
            onSelectBatch={handleSelectBatch}
            onSelectAll={handleSelectAll}
            onEditBatch={handleEditBatch}
            onDeleteBatch={handleDeleteBatch}
            loading={loading}
          />
        )}
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
