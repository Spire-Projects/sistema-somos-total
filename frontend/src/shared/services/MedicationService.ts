import type { Medication, MedicationBatch } from '../types/Medication';
import type { CreateMedicationData, UpdateMedicationData, CreateMedicationBatchData, UpdateMedicationBatchData } from '../types/MedicationCrud';
import { getMedicationDB } from '../db/models/medication.model';
import { generateId } from '../utils/id.utils';

/**
 * Crear un nuevo medicamento
 */
export const createMedication = async (data: CreateMedicationData): Promise<Medication> => {
  const db = getMedicationDB();
  
  // Verificar si ya existe un medicamento con el mismo nombre comercial
  const existing = await db.findByTradeName(data.tradeName);
  if (existing) {
    throw new Error(`Medication with trade name "${data.tradeName}" already exists`);
  }
  
  // Verificar si ya existe un medicamento con el mismo código de barras (si se proporciona)
  if (data.barcode) {
    const barcodeExists = await db.findByBarcode(data.barcode);
    if (barcodeExists) {
      throw new Error(`Medication with barcode "${data.barcode}" already exists`);
    }
  }
  
  const newMedication: Medication = {
    id: generateId(),
    tradeName: data.tradeName,
    genericName: data.genericName,
    activeIngredientIds: data.activeIngredientIds,
    pharmaceuticalFormId: data.pharmaceuticalFormId,
    concentration: data.concentration,
    presentation: data.presentation,
    manufacturerId: data.manufacturerId,
    categoryId: data.categoryId,
    barcode: data.barcode,
    batches: [], // Comienza sin lotes
    totalStock: 0, // Stock inicial en 0
    description: data.description,
    indications: data.indications,
    warnings: data.warnings,
    sincronized: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy
  };
  
  return await db.create(newMedication);
};

/**
 * Buscar medicamento por ID
 */
export const findMedicationById = async (id: string): Promise<Medication | null> => {
  const db = getMedicationDB();
  return await db.findById(id);
};

/**
 * Obtener todos los medicamentos
 */
export const findAllMedications = async (): Promise<Medication[]> => {
  const db = getMedicationDB();
  return await db.findAll();
};

/**
 * Buscar medicamento por nombre comercial
 */
export const findMedicationByTradeName = async (tradeName: string): Promise<Medication | null> => {
  const db = getMedicationDB();
  return await db.findByTradeName(tradeName);
};

/**
 * Buscar medicamento por código de barras
 */
export const findMedicationByBarcode = async (barcode: string): Promise<Medication | null> => {
  const db = getMedicationDB();
  return await db.findByBarcode(barcode);
};

/**
 * Buscar medicamentos por categoría
 */
export const findMedicationsByCategory = async (categoryId: string): Promise<Medication[]> => {
  const db = getMedicationDB();
  return await db.findByCategory(categoryId);
};

/**
 * Buscar medicamentos por fabricante
 */
export const findMedicationsByManufacturer = async (manufacturerId: string): Promise<Medication[]> => {
  const db = getMedicationDB();
  return await db.findByManufacturer(manufacturerId);
};

/**
 * Actualizar medicamento
 */
export const updateMedication = async (id: string, data: UpdateMedicationData): Promise<Medication> => {
  const db = getMedicationDB();
  
  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Medication with ID "${id}" not found`);
  }
  
  // Si se está cambiando el nombre comercial, verificar que no exista otro con ese nombre
  if (data.tradeName && data.tradeName !== existing.tradeName) {
    const nameExists = await db.findByTradeName(data.tradeName);
    if (nameExists) {
      throw new Error(`Medication with trade name "${data.tradeName}" already exists`);
    }
  }
  
  // Si se está cambiando el código de barras, verificar que no exista otro con ese código
  if (data.barcode && data.barcode !== existing.barcode) {
    const barcodeExists = await db.findByBarcode(data.barcode);
    if (barcodeExists) {
      throw new Error(`Medication with barcode "${data.barcode}" already exists`);
    }
  }
  
  const updateData = {
    ...data,
    sincronized: false, // Marcar como no sincronizado al actualizar
    updatedAt: new Date().toISOString()
  };
  
  return await db.update(id, updateData);
};

/**
 * Eliminar medicamento (soft delete)
 */
export const deleteMedication = async (id: string): Promise<boolean> => {
  const db = getMedicationDB();
  
  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Medication with ID "${id}" not found`);
  }
  
  return await db.delete(id);
};

/**
 * Buscar medicamentos
 */
export const searchMedications = async (query: string): Promise<Medication[]> => {
  const db = getMedicationDB();
  return await db.search(query);
};

// ============= OPERACIONES DE LOTES =============

/**
 * Agregar un lote a un medicamento
 */
export const addMedicationBatch = async (medicationId: string, data: CreateMedicationBatchData): Promise<Medication> => {
  const db = getMedicationDB();
  
  const batch: MedicationBatch = {
    batchId: data.batchId, // Usuario define el ID del lote
    expirationDate: data.expirationDate,
    quantity: data.quantity,
    purchasePrice: data.purchasePrice,
    sellingPrice: data.sellingPrice,
    purchaseDate: data.purchaseDate,
    supplier: data.supplier,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy
  };
  
  return await db.addBatch(medicationId, batch);
};

/**
 * Actualizar un lote de medicamento
 */
export const updateMedicationBatch = async (medicationId: string, batchId: string, data: UpdateMedicationBatchData): Promise<Medication> => {
  const db = getMedicationDB();
  
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  return await db.updateBatch(medicationId, batchId, updateData);
};

/**
 * Eliminar un lote de medicamento
 */
export const removeMedicationBatch = async (medicationId: string, batchId: string): Promise<Medication> => {
  const db = getMedicationDB();
  return await db.removeBatch(medicationId, batchId);
};

/**
 * Obtener lotes de un medicamento específico
 */
export const getMedicationBatches = async (medicationId: string): Promise<MedicationBatch[]> => {
  const db = getMedicationDB();
  const medication = await db.findById(medicationId);
  
  if (!medication) {
    throw new Error(`Medication with ID "${medicationId}" not found`);
  }
  
  return medication.batches;
};

/**
 * Buscar lote específico en un medicamento
 */
export const findMedicationBatch = async (medicationId: string, batchId: string): Promise<MedicationBatch | null> => {
  const batches = await getMedicationBatches(medicationId);
  return batches.find(batch => batch.batchId === batchId) || null;
};

/**
 * Calcular stock total de un medicamento (suma de todos los lotes)
 */
export const calculateTotalStock = async (medicationId: string): Promise<number> => {
  const batches = await getMedicationBatches(medicationId);
  return batches.reduce((total, batch) => total + batch.quantity, 0);
};

/**
 * Obtener lotes próximos a vencer (dentro de los próximos N días)
 */
export const getExpiringBatches = async (medicationId: string, daysFromNow: number = 30): Promise<MedicationBatch[]> => {
  const batches = await getMedicationBatches(medicationId);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);
  
  return batches.filter(batch => {
    const expirationDate = new Date(batch.expirationDate);
    return expirationDate <= futureDate;
  }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
};
