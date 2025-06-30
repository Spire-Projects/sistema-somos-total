import type { MedicationCategory } from "../types/Medication";
import type {
  CreateMedicationCategoryData,
  UpdateMedicationCategoryData,
} from "../types/MedicationCrud";
import type { ItemsResponse } from "../types/UtilTypes";
import { getMedicationCategoryRepository } from "../db/repositories/category.repository";
import { generateId } from "../utils/id.utils";

// Instancia global del repository
const repository = getMedicationCategoryRepository();

/**
 * Crear una nueva categoría de medicamento
 */
export const createMedicationCategory = async (
  data: CreateMedicationCategoryData
): Promise<MedicationCategory> => {
  // Verificar si ya existe una categoría con el mismo nombre
  const existing = await repository.findByName(data.name);
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

  return await repository.create(newCategory);
};

/**
 * Buscar categoría por ID
 */
export const findMedicationCategoryById = async (
  id: string
): Promise<MedicationCategory | null> => {
  return await repository.findById(id);
};

/**
 * Obtener todas las categorías
 */
export const findAllMedicationCategories = async (): Promise<
  MedicationCategory[]
> => {
  return await repository.findAll();
};

/**
 * Buscar categoría por nombre
 */
export const findMedicationCategoryByName = async (
  name: string
): Promise<MedicationCategory | null> => {
  return await repository.findByName(name);
};

/**
 * Actualizar categoría
 */
export const updateMedicationCategory = async (
  id: string,
  data: UpdateMedicationCategoryData
): Promise<MedicationCategory | null> => {
  // Verificar si existe
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Medication category with ID "${id}" not found`);
  }

  // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
  if (data.name && data.name !== existing.name) {
    const nameExists = await repository.findByName(data.name);
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

  await repository.update(id, updateData);
  return await repository.findById(id);
};

/**
 * Eliminar categoría
 */
export const deleteMedicationCategory = async (
  id: string
): Promise<boolean> => {
  // Verificar si existe
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Medication category with ID "${id}" not found`);
  }

  return await repository.delete(id);
};

/**
 * Buscar categorías
 */
export const searchMedicationCategories = async (
  query: string
): Promise<MedicationCategory[]> => {
  return await repository.search(query);
};

/**
 * Obtener categorías paginadas con búsqueda opcional
 */
export const findMedicationCategoriesPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
): Promise<ItemsResponse<MedicationCategory>> => {
  return await repository.findAllPaginated(page, size, searchQuery);
};
