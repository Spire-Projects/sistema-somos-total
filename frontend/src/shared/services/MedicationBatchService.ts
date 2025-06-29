import { getMedicationRepository } from '../db/repositories/medication.repository';
import { getMedicationBatchRepository } from '../db/repositories/medicationBatch.repository';
import type { 
  MedicationBatch, 
  BatchFilters, 
  BatchSearchResult,
  BatchStatistics,
  MedicationWithBatches
} from '../types/Medication';
import type { 
  CreateMedicationBatchData, 
  UpdateMedicationBatchData 
} from '../types/MedicationCrud';
import type { ItemsResponse } from '../types/UtilTypes';

const medicationBatchDb = getMedicationBatchRepository();
const medicationDb = getMedicationRepository();
/**
 * Crear un nuevo lote de medicamento
 */
export const createMedicationBatch = async (data: CreateMedicationBatchData): Promise<MedicationBatch> => {
  const batchDB = medicationBatchDb;
  const medicationDB = medicationDb;
  
  // Verificar que el medicamento existe
  const medication = await medicationDB.findById(data.medicationId);
  if (!medication) {
    throw new Error(`Medication with ID "${data.medicationId}" not found`);
  }
  
  // Verificar que no existe otro lote con el mismo batchId para este medicamento
  const existingBatch = await batchDB.batchIdExistsForMedication(data.medicationId, data.batchId);
  if (existingBatch) {
    throw new Error(`Batch with ID "${data.batchId}" already exists for this medication`);
  }
  
  // Validaciones de negocio
  if (data.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  if (data.purchasePrice < 0) {
    throw new Error('Purchase price cannot be negative');
  }
  
  if (data.sellingPrice < 0) {
    throw new Error('Selling price cannot be negative');
  }
  
  if (data.sellingPrice < data.purchasePrice) {
    console.warn('Warning: Selling price is lower than purchase price');
  }
  
  // Validar fecha de vencimiento
  const expirationDate = new Date(data.expirationDate);
  const today = new Date();
  if (expirationDate <= today) {
    throw new Error('Expiration date must be in the future');
  }
  
  return await batchDB.create(data);
};

/**
 * Buscar lote por ID
 */
export const findMedicationBatchById = async (id: string): Promise<MedicationBatch | null> => {
  const db = medicationBatchDb;
  return await db.findById(id);
};

/**
 * Buscar lotes por medicamento con paginación
 */
export const findBatchesByMedicationId = async (
  medicationId: string, 
  page: number = 1, 
  size: number = 10
): Promise<BatchSearchResult> => {
  const db = medicationBatchDb;
  return await db.findByMedicationId(medicationId, page, size);
};

/**
 * Buscar lotes con filtros avanzados
 */
export const findBatchesWithFilters = async (
  filters: BatchFilters,
  page: number = 1,
  size: number = 10
): Promise<BatchSearchResult> => {
  const db = medicationBatchDb;
  return await db.findWithFilters(filters, page, size);
};

/**
 * Actualizar lote de medicamento
 */
export const updateMedicationBatch = async (id: string, data: UpdateMedicationBatchData): Promise<MedicationBatch> => {
  const db = medicationBatchDb;
  
  // Verificar que el lote existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Batch with ID "${id}" not found`);
  }
  
  // Si se está cambiando el batchId, verificar que no exista otro con ese ID
  if (data.batchId && data.batchId !== existing.batchId) {
    const batchExists = await db.batchIdExistsForMedication(existing.medicationId, data.batchId, id);
    if (batchExists) {
      throw new Error(`Batch with ID "${data.batchId}" already exists for this medication`);
    }
  }
  
  // Validaciones de negocio
  if (data.quantity !== undefined && data.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  if (data.purchasePrice !== undefined && data.purchasePrice < 0) {
    throw new Error('Purchase price cannot be negative');
  }
  
  if (data.sellingPrice !== undefined && data.sellingPrice < 0) {
    throw new Error('Selling price cannot be negative');
  }
  
  // Validar fecha de vencimiento si se está actualizando
  if (data.expirationDate) {
    const expirationDate = new Date(data.expirationDate);
    const today = new Date();
    if (expirationDate <= today) {
      throw new Error('Expiration date must be in the future');
    }
  }
  
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  return await db.update(id, updateData);
};

/**
 * Eliminar lote de medicamento (soft delete)
 */
export const deleteMedicationBatch = async (id: string): Promise<void> => {
  const db = medicationBatchDb;
  
  // Verificar que el lote existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Batch with ID "${id}" not found`);
  }
  
  await db.delete(id);
};

/**
 * Buscar lotes que vencen en los próximos N días
 */
export const findBatchesExpiringInDays = async (days: number): Promise<MedicationBatch[]> => {
  const db = medicationBatchDb;
  return await db.findBatchesExpiringInDays(days);
};

/**
 * Buscar lotes por proveedor
 */
export const findBatchesBySupplier = async (supplier: string): Promise<MedicationBatch[]> => {
  const db = medicationBatchDb;
  return await db.findBatchesBySupplier(supplier);
};

/**
 * Obtener stock total de un medicamento
 */
export const getTotalStockByMedicationId = async (medicationId: string): Promise<number> => {
  const db = medicationBatchDb;
  return await db.getTotalStockByMedicationId(medicationId);
};

/**
 * Obtener cantidad de lotes de un medicamento
 */
export const getBatchCountByMedicationId = async (medicationId: string): Promise<number> => {
  const db = medicationBatchDb;
  return await db.getBatchCountByMedicationId(medicationId);
};

/**
 * Obtener estadísticas de lotes
 */
export const getBatchStatistics = async (medicationId?: string): Promise<BatchStatistics> => {
  const db = medicationBatchDb;
  return await db.getStatistics(medicationId);
};

/**
 * Verificar si un batchId ya existe para un medicamento
 */
export const batchIdExistsForMedication = async (
  medicationId: string, 
  batchId: string, 
  excludeId?: string
): Promise<boolean> => {
  const db = medicationBatchDb;
  return await db.batchIdExistsForMedication(medicationId, batchId, excludeId);
};

/**
 * Obtener medicamento con sus lotes (para UI que necesite datos combinados)
 */
export const getMedicationWithBatches = async (
  medicationId: string,
  batchPage: number = 1,
  batchSize: number = 10
): Promise<MedicationWithBatches | null> => {
  const medicationDB = medicationDb;
  const batchDB = medicationBatchDb;
  
  // Obtener medicamento
  const medication = await medicationDB.findById(medicationId);
  if (!medication) {
    return null;
  }
  
  // Obtener lotes paginados
  const batchResult = await batchDB.findByMedicationId(medicationId, batchPage, batchSize);
  
  // Calcular información adicional
  const totalStock = await batchDB.getTotalStockByMedicationId(medicationId);
  const batchCount = await batchDB.getBatchCountByMedicationId(medicationId);
  
  // Encontrar el lote más próximo a vencer
  let oldestBatch: MedicationBatch | undefined;
  if (batchResult.batches.length > 0) {
    oldestBatch = batchResult.batches.reduce((oldest: MedicationBatch, current: MedicationBatch) => 
      new Date(current.expirationDate) < new Date(oldest.expirationDate) ? current : oldest
    );
  }
  
  return {
    medication,
    batches: batchResult.batches,
    totalStock,
    batchCount,
    oldestBatch
  };
};

/**
 * Obtener medicamentos con sus lotes paginados (para la tabla de acordeón)
 */
export const getMedicationsWithBatchesPaginated = async (
  page: number = 1,
  size: number = 10
): Promise<ItemsResponse<MedicationWithBatches>> => {
  const medicationDB = medicationDb;
  
  // Obtener medicamentos paginados
  const medicationsResponse = await medicationDB.find(page, size);
  
  // Para cada medicamento, obtener sus datos de lotes
  const medicationsWithBatches: MedicationWithBatches[] = [];
  
  for (const medication of medicationsResponse.items) {
    const medicationWithBatches = await getMedicationWithBatches(medication.id, 1, 20); // Obtener primeros 20 lotes
    if (medicationWithBatches) {
      medicationsWithBatches.push(medicationWithBatches);
    }
  }
  
  return {
    items: medicationsWithBatches,
    page: medicationsResponse.page,
    size: medicationsResponse.size,
    totalItems: medicationsResponse.totalItems,
    totalPages: medicationsResponse.totalPages
  };
};

/**
 * Buscar medicamentos y sus lotes por texto
 */
export const searchMedicationsWithBatches = async (
  query: string,
  page: number = 1,
  size: number = 10
): Promise<ItemsResponse<MedicationWithBatches>> => {
  const medicationDB = medicationDb;
  
  // Buscar medicamentos por texto
  const medications = await medicationDB.search(query);
  
  // Paginar resultados manualmente
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  const paginatedMedications = medications.slice(startIndex, endIndex);
  
  // Para cada medicamento, obtener sus datos de lotes
  const medicationsWithBatches: MedicationWithBatches[] = [];
  
  for (const medication of paginatedMedications) {
    const medicationWithBatches = await getMedicationWithBatches(medication.id, 1, 20);
    if (medicationWithBatches) {
      medicationsWithBatches.push(medicationWithBatches);
    }
  }
  
  const totalPages = Math.ceil(medications.length / size);
  
  return {
    items: medicationsWithBatches,
    page: page,
    size: size,
    totalItems: medications.length,
    totalPages
  };
};

/**
 * Reportes y análisis
 */

/**
 * Obtener lotes próximos a vencer (30 días por defecto)
 */
export const getBatchesExpiringSoon = async (days: number = 30): Promise<MedicationBatch[]> => {
  return await findBatchesExpiringInDays(days);
};

/**
 * Obtener lotes ya vencidos
 */
export const getExpiredBatches = async (): Promise<MedicationBatch[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  return await findBatchesWithFilters({
    expirationDateTo: today
  }, 1, 1000).then(result => result.batches);
};

/**
 * Obtener resumen de inventario por proveedor
 */
export const getInventoryBySupplier = async (): Promise<{ supplier: string; batches: number; totalStock: number }[]> => {
  // Esta es una implementación simplificada
  // En una implementación real, necesitarías agrupar por proveedor
  const result = await findBatchesWithFilters({}, 1, 1000);
  
  const supplierMap = new Map<string, { batches: number; totalStock: number }>();
  
  result.batches.forEach(batch => {
    const supplier = batch.supplier || 'Sin proveedor';
    const current = supplierMap.get(supplier) || { batches: 0, totalStock: 0 };
    current.batches += 1;
    current.totalStock += batch.quantity;
    supplierMap.set(supplier, current);
  });
  
  return Array.from(supplierMap.entries()).map(([supplier, data]) => ({
    supplier,
    ...data
  }));
};
