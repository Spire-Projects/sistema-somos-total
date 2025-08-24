import type { Medication } from "../types/Medication";
import type {
  CreateMedicationData,
  UpdateMedicationData,
} from "../types/MedicationCrud";
import { generateId } from "../utils/id.utils";
import type { ItemsResponse } from "../types/UtilTypes";
import { getMedicationRepository } from "../db/repositories/medication.repository";
import type {
  MedicationCatalogView,
  MedicationCatalogFilters,
  MedicationCatalogQueryParams,
  MedicationCatalogSort,
} from "../types/MedicationViewTypes";
import { getMedicationBatchRepository } from "../db/repositories/medicationBatch.repository";
import {
  getStockStatus,
  calculateDaysToExpiration,
} from "../types/MedicationViewTypes";
import { findMedicationCategoryById } from "./MedicationCategoryService";
import { findManufacturerById } from "./ManufacturerService";
import { findPharmaceuticalFormById } from "./PharmaceuticalFormService";

// Cache opcional para optimizar consultas repetidas
const entityNameCache = new Map<string, string>();

/**
 * 🔧 HELPER: Obtener nombre de categoría con cache
 */
const getCategoryName = async (categoryId: string): Promise<string> => {
  const cacheKey = `category_${categoryId}`;
  
  if (entityNameCache.has(cacheKey)) {
    return entityNameCache.get(cacheKey)!;
  }

  const category = await findMedicationCategoryById(categoryId);
  const name = category?.name || "Sin categoría";
  
  entityNameCache.set(cacheKey, name);
  return name;
};

/**
 * 🔧 HELPER: Obtener nombre de fabricante con cache
 */
const getManufacturerName = async (manufacturerId: string): Promise<string> => {
  const cacheKey = `manufacturer_${manufacturerId}`;
  
  if (entityNameCache.has(cacheKey)) {
    return entityNameCache.get(cacheKey)!;
  }

  const manufacturer = await findManufacturerById(manufacturerId);
  const name = manufacturer?.name || "Sin fabricante";
  
  entityNameCache.set(cacheKey, name);
  return name;
};

/**
 * 🔧 HELPER: Obtener nombre de forma farmacéutica con cache
 */
const getPharmaceuticalFormName = async (pharmaceuticalFormId: string): Promise<string> => {
  const cacheKey = `pharmaceutical_form_${pharmaceuticalFormId}`;
  
  if (entityNameCache.has(cacheKey)) {
    return entityNameCache.get(cacheKey)!;
  }

  const pharmaceuticalForm = await findPharmaceuticalFormById(pharmaceuticalFormId);
  const name = pharmaceuticalForm?.name || "Sin forma";
  
  entityNameCache.set(cacheKey, name);
  return name;
};

/**
 * 🔧 HELPER: Limpiar cache (útil para testing o cuando se actualicen datos)
 */
export const clearEntityNameCache = (): void => {
  entityNameCache.clear();
};

// Crear una sola instancia del repositorio para todo el servicio
const medicationDB = getMedicationRepository();
// Crear instancia del repositorio de lotes
const medicationBatchDB = getMedicationBatchRepository();

/**
 * Crear un nuevo medicamento
 */
export const createMedication = async (
  data: CreateMedicationData
): Promise<Medication> => {
  // Verificar si ya existe un medicamento con el mismo nombre comercial
  const existing = await medicationDB.findByTradeName(data.tradeName);
  if (existing) {
    throw new Error(
      `Medication with trade name "${data.tradeName}" already exists`
    );
  }

  // Verificar si ya existe un medicamento con el mismo código de barras (si se proporciona)
  if (data.barcode) {
    const barcodeExists = await medicationDB.findByBarcode(data.barcode);
    if (barcodeExists) {
      throw new Error(
        `Medication with barcode "${data.barcode}" already exists`
      );
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
    createdBy: data.createdBy,
  };

  return await medicationDB.create(newMedication);
};

/**
 * Buscar medicamento por ID
 */
export const findMedicationById = async (
  id: string
): Promise<Medication | null> => {
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
export const findMedicationByTradeName = async (
  tradeName: string
): Promise<Medication | null> => {
  return await medicationDB.findByTradeName(tradeName);
};

/**
 * Buscar medicamento por código de barras
 */
export const findMedicationByBarcode = async (
  barcode: string
): Promise<Medication | null> => {
  return await medicationDB.findByBarcode(barcode);
};

/**
 * Buscar medicamentos por categoría
 */
export const findMedicationsByCategory = async (
  categoryId: string
): Promise<Medication[]> => {
  return await medicationDB.findByCategory(categoryId);
};

/**
 * Buscar medicamentos por fabricante
 */
export const findMedicationsByManufacturer = async (
  manufacturerId: string
): Promise<Medication[]> => {
  return await medicationDB.findByManufacturer(manufacturerId);
};

/**
 * Actualizar medicamento
 */
export const updateMedication = async (
  id: string,
  data: UpdateMedicationData
): Promise<Medication> => {
  // Verificar si existe
  const existing = await medicationDB.findById(id);
  if (!existing) {
    throw new Error(`Medication with ID "${id}" not found`);
  }

  // Si se está cambiando el nombre comercial, verificar que no exista otro con ese nombre
  if (data.tradeName && data.tradeName !== existing.tradeName) {
    const nameExists = await medicationDB.findByTradeName(data.tradeName);
    if (nameExists) {
      throw new Error(
        `Medication with trade name "${data.tradeName}" already exists`
      );
    }
  }

  // Si se está cambiando el código de barras, verificar que no exista otro con ese código
  if (data.barcode && data.barcode !== existing.barcode) {
    const barcodeExists = await medicationDB.findByBarcode(data.barcode);
    if (barcodeExists) {
      throw new Error(
        `Medication with barcode "${data.barcode}" already exists`
      );
    }
  }

  const updateData = {
    ...data,
    sincronized: false, // Marcar como no sincronizado al actualizar
    updatedAt: new Date().toISOString(),
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
export const searchMedications = async (
  query: string
): Promise<Medication[]> => {
  return await medicationDB.search(query);
};

export const findAllMedicationsPaginated = (
  page: number,
  size: number
): Promise<ItemsResponse<Medication>> => {
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

  // Separar campos de ordenamiento: los que existen en schema vs calculados
  const schemaFields = [
    "tradeName",
    "genericName",
    "comercialName",
    "createdAt",
    "updatedAt",
  ];
  const calculatedFields = [
    "totalActiveStock",
    "activeBatchCount",
    "categoryName",
    "manufacturerName",
  ];

  const isSchemaField = sort && schemaFields.includes(sort.field);
  const dbSort = isSchemaField ? sort : undefined; // Solo pasar sort si es campo del schema

  // 1. Obtener medicamentos paginados con filtros aplicados (solo ordenar si es campo del schema)
  const medicationsResponse = await medicationDB.findAllPaginatedWithFilters(
    page,
    size,
    filters,
    dbSort
  );

  // 2. Para cada medicamento, obtener sus datos de stock agregados
  let catalogViews: MedicationCatalogView[] = await Promise.all(
    medicationsResponse.items.map(async (medication) => {
      return await createMedicationCatalogView(medication);
    })
  );

  // 3. Si el ordenamiento es por campo calculado, ordenar en memoria
  if (sort && calculatedFields.includes(sort.field)) {
    catalogViews = sortCatalogViewsInMemory(catalogViews, sort);
  }

  // 4. Aplicar filtros de stock si los hay (que requieren datos de lotes)
  let filteredViews = catalogViews;
  if (
    filters?.stockStatus ||
    filters?.hasStock !== undefined ||
    filters?.minStock !== undefined ||
    filters?.maxStock !== undefined
  ) {
    filteredViews = catalogViews.filter((view) => {
      // Filtro por estado de stock
      if (filters.stockStatus && view.stockStatus !== filters.stockStatus) {
        return false;
      }

      // Filtro por stock activo
      if (
        filters.hasStock !== undefined &&
        view.totalActiveStock > 0 !== filters.hasStock
      ) {
        return false;
      }

      // Filtro por stock mínimo
      if (
        filters.minStock !== undefined &&
        view.totalActiveStock < filters.minStock
      ) {
        return false;
      }

      // Filtro por stock máximo
      if (
        filters.maxStock !== undefined &&
        view.totalActiveStock > filters.maxStock
      ) {
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
    totalPages: medicationsResponse.totalPages,
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
  // Crear filtros combinando la búsqueda con los filtros adicionales
  const combinedFilters: MedicationCatalogFilters = {
    ...filters,
    searchQuery: query,
  };

  // Usar el método principal que ya maneja ordenamiento híbrido
  return getMedicationCatalogPaginated({
    page,
    size,
    filters: combinedFilters,
  });
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
export const countMedicationsWithFilters = async (
  filters?: MedicationCatalogFilters
): Promise<number> => {
  return await medicationDB.countMedicationsWithFilters(filters);
};

/**
 * 🔧 HELPER: Crear vista de catálogo para un medicamento
 * Combina datos del medicamento con agregaciones de sus lotes
 */
const createMedicationCatalogView = async (
  medication: Medication
): Promise<MedicationCatalogView> => {
  // Obtener datos agregados de lotes y todos los lotes activos
  const [totalActiveStock, activeBatchCount, oldestActiveBatch, activeBatches] =
    await Promise.all([
      medicationBatchDB.getTotalActiveStockByMedicationId(medication.id),
      medicationBatchDB.getActiveBatchCountByMedicationId(medication.id),
      medicationBatchDB.getOldestActiveBatchByMedicationId(medication.id),
      medicationBatchDB.findActiveBatchesByMedicationId(medication.id),
    ]);

  // Resolver nombres de entidades relacionadas en paralelo con cache
  const [categoryName, manufacturerName, pharmaceuticalFormName] = await Promise.all([
    medication.categoryId 
      ? getCategoryName(medication.categoryId)
      : Promise.resolve("Sin categoría"),
    medication.manufacturerId 
      ? getManufacturerName(medication.manufacturerId)
      : Promise.resolve("Sin fabricante"),
    medication.pharmaceuticalFormId 
      ? getPharmaceuticalFormName(medication.pharmaceuticalFormId)
      : Promise.resolve("Sin forma"),
  ]);

  // Calcular estado de stock
  const stockStatus = getStockStatus(totalActiveStock);

  // Calcular días hasta expiración del lote más antiguo
  const daysToExpiration = oldestActiveBatch
    ? calculateDaysToExpiration(oldestActiveBatch.expirationDate)
    : null;

  // Transformar los lotes activos para la vista, ordenados por fecha de vencimiento
  const activeBatchesView = activeBatches
    .map((batch) => ({
      id: batch.id,
      batchId: batch.batchId,
      expirationDate: batch.expirationDate,
      quantity: batch.quantity,
      daysToExpiration: calculateDaysToExpiration(batch.expirationDate),
      purchasePrice: batch.purchasePrice,
      sellingPrice: batch.sellingPrice,
      purchaseDate: batch.purchaseDate || '',
      supplier: batch.supplier || '',
    }))
    .sort((a, b) => a.daysToExpiration - b.daysToExpiration); // Ordenar por fecha de vencimiento más próxima

  return {
    id: medication.id,
    comercialName: medication.comercialName,
    tradeName: medication.tradeName,
    genericName: medication.genericName,
    concentration: medication.concentration,
    presentation: medication.presentation,
    barcode: medication.barcode,

    // Datos resueltos - nombres reales obtenidos de servicios
    manufacturerName,
    categoryName,
    pharmaceuticalFormName,

    totalActiveStock,
    activeBatchCount,
    hasStock: totalActiveStock > 0,
    stockStatus,

    // Información del batch más crítico
    oldestActiveBatch: oldestActiveBatch
      ? {
          id: oldestActiveBatch.id,
          batchId: oldestActiveBatch.batchId,
          expirationDate: oldestActiveBatch.expirationDate,
          quantity: oldestActiveBatch.quantity,
          daysToExpiration: daysToExpiration || 0,
        }
      : undefined,

    // Todos los lotes activos con precios, ordenados por vencimiento
    activeBatches: activeBatchesView,

    createdAt: medication.createdAt,
  };
};

/**
 * 🔧 HELPER: Ordenar vistas de catálogo en memoria por campos calculados
 * Usado cuando el ordenamiento es por campos que no existen en el schema de medications
 */
const sortCatalogViewsInMemory = (
  catalogViews: MedicationCatalogView[],
  sort: MedicationCatalogSort
): MedicationCatalogView[] => {
  return [...catalogViews].sort((a, b) => {
    let valueA: any, valueB: any;

    // Obtener los valores a comparar según el campo de ordenamiento
    switch (sort.field) {
      case "totalActiveStock":
        valueA = a.totalActiveStock;
        valueB = b.totalActiveStock;
        break;
      case "activeBatchCount":
        valueA = a.activeBatchCount;
        valueB = b.activeBatchCount;
        break;
      case "categoryName":
        valueA = a.categoryName.toLowerCase();
        valueB = b.categoryName.toLowerCase();
        break;
      case "manufacturerName":
        valueA = a.manufacturerName.toLowerCase();
        valueB = b.manufacturerName.toLowerCase();
        break;
      default:
        // Para campos que no son calculados (fallback), usar string comparison
        valueA = String(
          a[sort.field as keyof MedicationCatalogView] || ""
        ).toLowerCase();
        valueB = String(
          b[sort.field as keyof MedicationCatalogView] || ""
        ).toLowerCase();
        break;
    }

    // Realizar la comparación
    let result = 0;
    if (typeof valueA === "number" && typeof valueB === "number") {
      result = valueA - valueB;
    } else {
      result = String(valueA).localeCompare(String(valueB));
    }

    // Aplicar orden descendente si es necesario
    return sort.order === "desc" ? -result : result;
  });
};

/**
 * Obtener todos los lotes activos de un medicamento, ordenados por vencimiento ascendente
 */
export const getActiveBatchesForMedication = async (
  medicationId: string,
  page: number,
  size: number
) => {
  const activeBatches =
    await medicationBatchDB.findActiveBatchesByMedicationIdPaginated(
      medicationId,
      page,
      size
    );
  return activeBatches.items
    .map((batch) => ({
      id: batch.id,
      batchId: batch.batchId,
      expirationDate: batch.expirationDate,
      quantity: batch.quantity,
      daysToExpiration: calculateDaysToExpiration(batch.expirationDate),
      purchasePrice: batch.purchasePrice,
      sellingPrice: batch.sellingPrice,
      purchaseDate: batch.purchaseDate,
      supplier: batch.supplier,
    }))
    .sort((a, b) => a.daysToExpiration - b.daysToExpiration);
};

/**
 * Obtener medicamentos del catálogo para exportación con rango de fechas
 */
export const getMedicationCatalogExport = async (
  dateRange: { from: Date; to: Date },
  _selectedFields?: string[] // Parámetro no utilizado por ahora
): Promise<MedicationCatalogView[]> => {
  try {
    // Crear filtros para obtener medicamentos en el rango de fechas
    const filters: MedicationCatalogFilters = {
      createdFrom: dateRange.from.toISOString(),
      createdTo: dateRange.to.toISOString()
    };

    // Obtener todos los medicamentos sin paginación (usando un tamaño grande)
    const result = await medicationDB.findAllPaginatedWithFilters(
      1, // página 1
      10000, // tamaño grande para obtener todos
      filters
    );

    // Convertir cada medicamento a vista de catálogo
    const catalogViews: MedicationCatalogView[] = await Promise.all(
      result.items.map(async (medication) => {
        return await createMedicationCatalogView(medication);
      })
    );

    // Nota: selectedFields se puede usar en el futuro para filtrar campos específicos
    // Por ahora retornamos todos los campos disponibles
    return catalogViews;
  } catch (error) {
    console.error('Error getting medication catalog for export:', error);
    throw new Error('Error al obtener datos para exportación');
  }
};


export const getMedicationViewById = async (
  id: string
): Promise<MedicationCatalogView | null> => {
  const medication = await findMedicationById(id);
  if (!medication) return null;

  // Crear vista de catálogo para el medicamento
  return await createMedicationCatalogView(medication);
}