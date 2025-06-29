import type { Medication } from '../types/Medication';
import type { CreateMedicationData, UpdateMedicationData } from '../types/MedicationCrud';
import { generateId } from '../utils/id.utils';
import type { ItemsResponse } from '../types/UtilTypes';
import { getMedicationRepository } from '../db/repositories/medication.repository';

// Crear una sola instancia del repositorio para todo el servicio
const medicationDB = getMedicationRepository();
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

