import type { Medication } from '../types/Medication';
import type { BatchWithMedication, CreateBatchData, BatchFilter } from '../types/Sales';
import { findAllMedications, addMedicationBatch, updateMedicationBatch, removeMedicationBatch, findMedicationById } from './MedicationService';

export interface BatchServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

export interface PaginatedBatchResult {
  batches: BatchWithMedication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Servicio para gestión de lotes de medicamentos
 */
export class BatchService {
  
  /**
   * Obtener todos los lotes con información de medicamento
   */
  static async getAllBatches(): Promise<BatchServiceResult<BatchWithMedication[]>> {
    try {
      const medications = await findAllMedications();
      const batchesWithMedication: BatchWithMedication[] = [];

      medications.forEach(medication => {
        medication.batches.forEach(batch => {
          batchesWithMedication.push({
            ...batch,
            medication: {
              id: medication.id,
              tradeName: medication.tradeName,
              genericName: medication.genericName,
              concentration: medication.concentration,
              presentation: medication.presentation
            }
          });
        });
      });

      return {
        success: true,
        data: batchesWithMedication,
        total: batchesWithMedication.length
      };
    } catch (error) {
      console.error('Error getting all batches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener lotes paginados con filtros
   */
  static async getBatchesPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: BatchFilter,
    searchQuery?: string
  ): Promise<BatchServiceResult<PaginatedBatchResult>> {
    try {
      // Obtener todos los lotes primero
      const allBatchesResult = await this.getAllBatches();
      
      if (!allBatchesResult.success || !allBatchesResult.data) {
        return {
          success: false,
          error: allBatchesResult.error || 'Error obteniendo lotes'
        };
      }

      let filteredBatches = allBatchesResult.data;

      // Aplicar filtro de búsqueda
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredBatches = filteredBatches.filter(batch =>
          batch.medication.tradeName.toLowerCase().includes(query) ||
          batch.medication.genericName.toLowerCase().includes(query) ||
          batch.batchId.toLowerCase().includes(query) ||
          batch.supplier?.toLowerCase().includes(query)
        );
      }

      // Aplicar filtros de fecha
      if (filters?.dateFrom) {
        filteredBatches = filteredBatches.filter(batch => {
          const purchaseDate = batch.purchaseDate || batch.createdAt;
          return purchaseDate && purchaseDate >= filters.dateFrom!;
        });
      }

      if (filters?.dateTo) {
        filteredBatches = filteredBatches.filter(batch => {
          const purchaseDate = batch.purchaseDate || batch.createdAt;
          return purchaseDate && purchaseDate <= filters.dateTo!;
        });
      }

      // Aplicar filtro de medicamento
      if (filters?.medicationId) {
        filteredBatches = filteredBatches.filter(batch => 
          batch.medication.id === filters.medicationId
        );
      }

      // Calcular paginación
      const total = filteredBatches.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBatches = filteredBatches.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          batches: paginatedBatches,
          total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting paginated batches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear un nuevo lote
   */
  static async createBatch(data: CreateBatchData): Promise<BatchServiceResult<BatchWithMedication>> {
    try {
      // Verificar que el medicamento existe
      const medication = await findMedicationById(data.medicationId);
      if (!medication) {
        return {
          success: false,
          error: 'Medicamento no encontrado'
        };
      }

      // Verificar que no existe un lote con el mismo ID para este medicamento
      const existingBatch = medication.batches.find(batch => batch.batchId === data.batchId);
      if (existingBatch) {
        return {
          success: false,
          error: `Ya existe un lote con ID "${data.batchId}" para este medicamento`
        };
      }

      // Crear el lote
      const updatedMedication = await addMedicationBatch(data.medicationId, data);

      // Encontrar el lote recién creado
      const newBatch = updatedMedication.batches.find(batch => batch.batchId === data.batchId);
      if (!newBatch) {
        return {
          success: false,
          error: 'Error creando el lote'
        };
      }

      const batchWithMedication: BatchWithMedication = {
        ...newBatch,
        medication: {
          id: updatedMedication.id,
          tradeName: updatedMedication.tradeName,
          genericName: updatedMedication.genericName,
          concentration: updatedMedication.concentration,
          presentation: updatedMedication.presentation
        }
      };

      return {
        success: true,
        data: batchWithMedication
      };
    } catch (error) {
      console.error('Error creating batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando el lote'
      };
    }
  }

  /**
   * Actualizar un lote existente
   */
  static async updateBatch(
    medicationId: string, 
    batchId: string, 
    data: Partial<CreateBatchData>
  ): Promise<BatchServiceResult<BatchWithMedication>> {
    try {
      const updatedMedication = await updateMedicationBatch(medicationId, batchId, data);
      
      const updatedBatch = updatedMedication.batches.find(batch => batch.batchId === batchId);
      if (!updatedBatch) {
        return {
          success: false,
          error: 'Lote no encontrado después de la actualización'
        };
      }

      const batchWithMedication: BatchWithMedication = {
        ...updatedBatch,
        medication: {
          id: updatedMedication.id,
          tradeName: updatedMedication.tradeName,
          genericName: updatedMedication.genericName,
          concentration: updatedMedication.concentration,
          presentation: updatedMedication.presentation
        }
      };

      return {
        success: true,
        data: batchWithMedication
      };
    } catch (error) {
      console.error('Error updating batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando el lote'
      };
    }
  }

  /**
   * Eliminar un lote
   */
  static async deleteBatch(medicationId: string, batchId: string): Promise<BatchServiceResult<boolean>> {
    try {
      await removeMedicationBatch(medicationId, batchId);
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Error deleting batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error eliminando el lote'
      };
    }
  }

  /**
   * Obtener estadísticas de lotes
   */
  static async getBatchStats(): Promise<BatchServiceResult<{
    totalBatches: number;
    totalValue: number;
    averageMargin: number;
    expiringBatches: number;
  }>> {
    try {
      const allBatchesResult = await this.getAllBatches();
      
      if (!allBatchesResult.success || !allBatchesResult.data) {
        return {
          success: false,
          error: allBatchesResult.error || 'Error obteniendo estadísticas'
        };
      }

      const batches = allBatchesResult.data;
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

      // Contar lotes que expiran en los próximos 30 días
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      const expiringBatches = batches.filter(batch => {
        const expirationDate = new Date(batch.expirationDate);
        return expirationDate <= thirtyDaysFromNow && expirationDate > now;
      }).length;

      return {
        success: true,
        data: {
          totalBatches,
          totalValue,
          averageMargin,
          expiringBatches
        }
      };
    } catch (error) {
      console.error('Error getting batch stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo estadísticas'
      };
    }
  }

  /**
   * Obtener todos los medicamentos para el selector
   */
  static async getMedicationsForSelector(): Promise<BatchServiceResult<Medication[]>> {
    try {
      const medications = await findAllMedications();
      return {
        success: true,
        data: medications
      };
    } catch (error) {
      console.error('Error getting medications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo medicamentos'
      };
    }
  }
}
