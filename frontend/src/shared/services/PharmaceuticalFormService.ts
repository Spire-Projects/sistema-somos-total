import type { PharmaceuticalFormDoc } from "../types/Medication";
import type {
  CreatePharmaceuticalFormData,
  UpdatePharmaceuticalFormData,
} from "../types/MedicationCrud";
import type { ItemsResponse } from "../types/UtilTypes";
import { getPharmaceuticalFormRepository } from "../db/repositories/pharmaceuticalForm.repository";
import { generateId } from "../utils/id.utils";

// Instancia global del repository
const repository = getPharmaceuticalFormRepository();

/**
 * Crear una nueva forma farmacéutica
 */
export const createPharmaceuticalForm = async (
  data: CreatePharmaceuticalFormData
): Promise<PharmaceuticalFormDoc> => {
  // Verificar si ya existe una forma farmacéutica con el mismo nombre
  const existing = await repository.findByName(data.name);
  if (existing) {
    throw new Error(
      `Pharmaceutical form with name "${data.name}" already exists`
    );
  }

  const newForm: PharmaceuticalFormDoc = {
    id: generateId(),
    name: data.name,
    aliases: data.aliases,
    description: data.description,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy,
    sincronized: false,
    isDeleted: false,
  };

  return await repository.create(newForm);
};

/**
 * Buscar forma farmacéutica por ID
 */
export const findPharmaceuticalFormById = async (
  id: string
): Promise<PharmaceuticalFormDoc | null> => {
  return await repository.findById(id);
};

/**
 * Obtener todas las formas farmacéuticas
 */
export const findAllPharmaceuticalForms = async (): Promise<
  PharmaceuticalFormDoc[]
> => {
  return await repository.findAll();
};

/**
 * Buscar forma farmacéutica por nombre
 */
export const findPharmaceuticalFormByName = async (
  name: string
): Promise<PharmaceuticalFormDoc | null> => {
  return await repository.findByName(name);
};

/**
 * Actualizar forma farmacéutica
 */
export const updatePharmaceuticalForm = async (
  id: string,
  data: UpdatePharmaceuticalFormData
): Promise<PharmaceuticalFormDoc | null> => {
  // Verificar si existe
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Pharmaceutical form with ID "${id}" not found`);
  }

  // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
  if (data.name && data.name !== existing.name) {
    const nameExists = await repository.findByName(data.name);
    if (nameExists) {
      throw new Error(
        `Pharmaceutical form with name "${data.name}" already exists`
      );
    }
  }

  const updateData = {
    ...data,
    sincronized: false, // Marcar como no sincronizado al actualizar
    updatedAt: new Date().toISOString(),
  };

  await repository.update(id, updateData);
  return await repository.findById(id);
};

/**
 * Eliminar forma farmacéutica (soft delete)
 */
export const deletePharmaceuticalForm = async (
  id: string
): Promise<boolean> => {
  // Verificar si existe
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Pharmaceutical form with ID "${id}" not found`);
  }

  return await repository.delete(id);
};

/**
 * Buscar formas farmacéuticas
 */
export const searchPharmaceuticalForms = async (
  query: string
): Promise<PharmaceuticalFormDoc[]> => {
  return await repository.search(query);
};

/**
 * Obtener formas farmacéuticas paginadas con búsqueda opcional
 */
export const findPharmaceuticalFormsPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
): Promise<ItemsResponse<PharmaceuticalFormDoc>> => {
  return await repository.findAllPaginated(page, size, searchQuery);
};
