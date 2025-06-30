import type { Medication } from '../types/Medication';
import type { CreateMedicationData, UpdateMedicationData } from '../types/MedicationCrud';
import { generateId } from '../utils/id.utils';
import type { ItemsResponse } from '../types/UtilTypes';
import { getMedicationRepository } from '../db/repositories/medication.repository';
import type { 
  MedicationCatalogView, 
  MedicationCatalogFilters, 
  MedicationCatalogQueryParams
} from '../types/MedicationViewTypes';
import { getMedicationBatchRepository } from '../db/repositories/medicationBatch.repository';
import { getStockStatus, calculateDaysToExpiration } from '../types/MedicationViewTypes';

// Crear una sola instancia del repositorio para todo el servicio
const medicationDB = getMedicationRepository();
// Crear instancia del repositorio de lotes
const medicationBatchDB = getMedicationBatchRepository();

/**
 * Crear un nuevo medicamento
 */
export const createMedication = async (data: CreateMedicationData): Promise<Medication> => {
  // Verificar si ya existe un medicamento con el mismo nombre comercial
  const existing = await medicationDB.findByTradeName(data.tradeName);
  if (existing) {
    throw new Error(`Medication with trade name "${data.tradeName}" already exists`);
  }
  
  // Verificar si ya existe un medicamento con el mismo código de barras (si se proporciona)
  if (data.barcode) {
    const barcodeExists = await medicationDB.findByBarcode(data.barcode);
    if (barcodeExists) {
      throw new Error(`Medication with barcode "${data.barcode}" already exists`);
    }
  }
  
  const newMedication: Medication = {
    id: generateId(),
    comercialName: data.comercialName,
    tradeName: data.tradeName,
    genericName: data.genericName,
    activeIngredientIds: data.activeIngredientIds,
    pharmaceuticalFormId: data.pharmaceuticalFormId,
    concentration: data.concentration,
    presentation: data.presentation,
    manufacturerId: data.manufacturerId,
    categoryId: data.categoryId,
    barcode: data.barcode,
    description: data.description,
    indications: data.indications,
    warnings: data.warnings,
    sincronized: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy
  };
  
  return await medicationDB.create(newMedication);
};

/**
 * Buscar medicamento por ID
 */
export const findMedicationById = async (id: string): Promise<Medication | null> => {
  return await medicationDB.findById(id);
};

/**
 * Obtener todos los medicamentos
 */
export const findAllMedications = async (): Promise<Medication[]> => {
  return await medicationDB.findAll();
};

/**
 * Buscar medicamento por nombre comercial
 */
export const findMedicationByTradeName = async (tradeName: string): Promise<Medication | null> => {
  return await medicationDB.findByTradeName(tradeName);
};

/**
 * Buscar medicamento por código de barras
 */
export const findMedicationByBarcode = async (barcode: string): Promise<Medication | null> => {
  return await medicationDB.findByBarcode(barcode);
};

/**
 * Buscar medicamentos por categoría
 */
export const findMedicationsByCategory = async (categoryId: string): Promise<Medication[]> => {
  return await medicationDB.findByCategory(categoryId);
};

/**
 * Buscar medicamentos por fabricante
 */
export const findMedicationsByManufacturer = async (manufacturerId: string): Promise<Medication[]> => {
  return await medicationDB.findByManufacturer(manufacturerId);
};

/**
 * Actualizar medicamento
 */
export const updateMedication = async (id: string, data: UpdateMedicationData): Promise<Medication> => {
  // Verificar si existe
  const existing = await medicationDB.findById(id);
  if (!existing) {
    throw new Error(`Medication with ID "${id}" not found`);
  }
  
  // Si se está cambiando el nombre comercial, verificar que no exista otro con ese nombre
  if (data.tradeName && data.tradeName !== existing.tradeName) {
    const nameExists = await medicationDB.findByTradeName(data.tradeName);
    if (nameExists) {
      throw new Error(`Medication with trade name "${data.tradeName}" already exists`);
    }
  }
  
  // Si se está cambiando el código de barras, verificar que no exista otro con ese código
  if (data.barcode && data.barcode !== existing.barcode) {
    const barcodeExists = await medicationDB.findByBarcode(data.barcode);
    if (barcodeExists) {
      throw new Error(`Medication with barcode "${data.barcode}" already exists`);
    }
  }
  
  const updateData = {
    ...data,
    sincronized: false, // Marcar como no sincronizado al actualizar
    updatedAt: new Date().toISOString()
  };
  
  return await medicationDB.update(id, updateData);
};

/**
 * Eliminar medicamento (soft delete)
 */
export const deleteMedication = async (id: string): Promise<boolean> => {
  // Verificar si existe
  const existing = await medicationDB.findById(id);
  if (!existing) {
    throw new Error(`Medication with ID "${id}" not found`);
  }
  
  return await medicationDB.delete(id);
};

/**
 * Buscar medicamentos
 */
export const searchMedications = async (query: string): Promise<Medication[]> => {
  return await medicationDB.search(query);
};

export const findAllMedicationsPaginated = (page: number, size: number): Promise<ItemsResponse<Medication>> => {
  return medicationDB.find(page, size);
};

/**
 * 🆕 MÉTODOS DEL CATÁLOGO OPTIMIZADO - COMBINAN MEDICAMENTOS Y LOTES
 */

/**
 * Obtener vista de catálogo paginada con filtros y agregaciones de stock
 */
export const getMedicationCatalogPaginated = async (
  params: MedicationCatalogQueryParams
): Promise<ItemsResponse<MedicationCatalogView>> => {
  const { page, size, filters, sort } = params;
  
  // 1. Obtener medicamentos paginados con filtros aplicados
  const medicationsResponse = await medicationDB.findAllPaginatedWithFilters(page, size, filters, sort);
  
  // 2. Para cada medicamento, obtener sus datos de stock agregados
  const catalogViews: MedicationCatalogView[] = await Promise.all(
    medicationsResponse.items.map(async (medication) => {
      return await createMedicationCatalogView(medication);
    })
  );
  
  // 3. Aplicar filtros de stock si los hay (que requieren datos de lotes)
  let filteredViews = catalogViews;
  if (filters?.stockStatus || filters?.hasStock !== undefined || filters?.minStock !== undefined || filters?.maxStock !== undefined) {
    filteredViews = catalogViews.filter(view => {
      // Filtro por estado de stock
      if (filters.stockStatus && view.stockStatus !== filters.stockStatus) {
        return false;
      }
      
      // Filtro por stock activo
      if (filters.hasStock !== undefined && (view.totalActiveStock > 0) !== filters.hasStock) {
        return false;
      }
      
      // Filtro por stock mínimo
      if (filters.minStock !== undefined && view.totalActiveStock < filters.minStock) {
        return false;
      }
      
      // Filtro por stock máximo
      if (filters.maxStock !== undefined && view.totalActiveStock > filters.maxStock) {
        return false;
      }
      
      return true;
    });
  }
  
  return {
    items: filteredViews,
    page: medicationsResponse.page,
    size: medicationsResponse.size,
    totalItems: medicationsResponse.totalItems,
    totalPages: medicationsResponse.totalPages
  };
};

/**
 * Buscar medicamentos en el catálogo con filtros y paginación
 */
export const searchMedicationCatalogPaginated = async (
  query: string,
  page: number,
  size: number,
  filters?: MedicationCatalogFilters
): Promise<ItemsResponse<MedicationCatalogView>> => {
  // 1. Buscar medicamentos con el query
  const medicationsResponse = await medicationDB.searchMedicationsPaginated(query, page, size, filters);
  
  // 2. Convertir a vista de catálogo
  const catalogViews: MedicationCatalogView[] = await Promise.all(
    medicationsResponse.items.map(async (medication) => {
      return await createMedicationCatalogView(medication);
    })
  );
  
  return {
    items: catalogViews,
    page: medicationsResponse.page,
    size: medicationsResponse.size,
    totalItems: medicationsResponse.totalItems,
    totalPages: medicationsResponse.totalPages
  };
};

/**
 * Obtener medicamentos que tienen stock activo (para filtros rápidos)
 */
export const getMedicationsWithActiveStock = async (): Promise<string[]> => {
  return await medicationBatchDB.findMedicationIdsWithActiveStock();
};

/**
 * Contar medicamentos con filtros aplicados
 */
export const countMedicationsWithFilters = async (filters?: MedicationCatalogFilters): Promise<number> => {
  return await medicationDB.countMedicationsWithFilters(filters);
};

/**
 * 🔧 HELPER: Crear vista de catálogo para un medicamento
 * Combina datos del medicamento con agregaciones de sus lotes
 */
const createMedicationCatalogView = async (medication: Medication): Promise<MedicationCatalogView> => {
  // Obtener datos agregados de lotes
  const [totalActiveStock, activeBatchCount, oldestActiveBatch] = await Promise.all([
    medicationBatchDB.getTotalActiveStockByMedicationId(medication.id),
    medicationBatchDB.getActiveBatchCountByMedicationId(medication.id),
    medicationBatchDB.getOldestActiveBatchByMedicationId(medication.id)
  ]);
  
  // Calcular estado de stock
  const stockStatus = getStockStatus(totalActiveStock);
  
  // Calcular días hasta expiración del lote más antiguo
  const daysToExpiration = oldestActiveBatch 
    ? calculateDaysToExpiration(oldestActiveBatch.expirationDate) 
    : null;
  
  return {
    id: medication.id,
    comercialName: medication.comercialName,
    tradeName: medication.tradeName,
    genericName: medication.genericName,
    concentration: medication.concentration,
    presentation: medication.presentation,
    barcode: medication.barcode,
    
    // Datos resueltos (por ahora usamos IDs, luego se pueden resolver)
    manufacturerName: medication.manufacturerId || 'Unknown', // TODO: resolver nombre
    categoryName: medication.categoryId || 'Unknown', // TODO: resolver nombre  
    pharmaceuticalFormName: medication.pharmaceuticalFormId || 'Unknown', // TODO: resolver nombre
    
    totalActiveStock,
    activeBatchCount,
    hasStock: totalActiveStock > 0,
    stockStatus,
    
    // Información del batch más crítico
    oldestActiveBatch: oldestActiveBatch ? {
      id: oldestActiveBatch.id,
      batchId: oldestActiveBatch.batchId,
      expirationDate: oldestActiveBatch.expirationDate,
      quantity: oldestActiveBatch.quantity,
      daysToExpiration: daysToExpiration || 0
    } : undefined,
    
    createdAt: medication.createdAt
  };
};

