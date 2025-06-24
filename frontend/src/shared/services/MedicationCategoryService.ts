import type { MedicationCategory } from "../types/Medication";
import type {
  CreateMedicationCategoryData,
  UpdateMedicationCategoryData,
} from "../types/MedicationCrud";
import { getMedicationCategoryDB } from "../db/models/medicationCategory.model";
import { generateId } from "../utils/id.utils";

/**
 * Crear una nueva categoría de medicamento
 */
export const createMedicationCategory = async (
  data: CreateMedicationCategoryData
): Promise<MedicationCategory> => {
  const db = getMedicationCategoryDB();

  // Verificar si ya existe una categoría con el mismo nombre
  const existing = await db.findByName(data.name);
  if (existing) {
    throw new Error(
      `Medication category with name "${data.name}" already exists`
    );
  }

  const newCategory: MedicationCategory = {
    id: generateId(),
    name: data.name,
    description: data.description,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy,
  };

  return await db.create(newCategory);
};

/**
 * Buscar categoría por ID
 */
export const findMedicationCategoryById = async (
  id: string
): Promise<MedicationCategory | null> => {
  const db = getMedicationCategoryDB();
  return await db.findById(id);
};

/**
 * Obtener todas las categorías
 */
export const findAllMedicationCategories = async (): Promise<
  MedicationCategory[]
> => {
  const db = getMedicationCategoryDB();
  return await db.findAll();
};

/**
 * Buscar categoría por nombre
 */
export const findMedicationCategoryByName = async (
  name: string
): Promise<MedicationCategory | null> => {
  const db = getMedicationCategoryDB();
  return await db.findByName(name);
};

/**
 * Actualizar categoría
 */
export const updateMedicationCategory = async (
  id: string,
  data: UpdateMedicationCategoryData
): Promise<MedicationCategory | null> => {
  const db = getMedicationCategoryDB();

  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Medication category with ID "${id}" not found`);
  }

  // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
  if (data.name && data.name !== existing.name) {
    const nameExists = await db.findByName(data.name);
    if (nameExists) {
      throw new Error(
        `Medication category with name "${data.name}" already exists`
      );
    }
  }

  const updateData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await db.update(id, updateData);
  return await db.findById(id);
};

/**
 * Eliminar categoría
 */
export const deleteMedicationCategory = async (
  id: string
): Promise<boolean> => {
  const db = getMedicationCategoryDB();

  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Medication category with ID "${id}" not found`);
  }

  return await db.delete(id);
};

/**
 * Buscar categorías
 */
export const searchMedicationCategories = async (
  query: string
): Promise<MedicationCategory[]> => {
  const db = getMedicationCategoryDB();
  return await db.search(query);
};
