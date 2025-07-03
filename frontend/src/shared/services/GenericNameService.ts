import { getGenericNameDocRepository } from "../db/repositories/genericName.repository";
import type { GenericNameDoc } from "../types/Medication";
import type {
  CreateGenericNameData,
  UpdateGenericNameData,
} from "../types/MedicationCrud";
import type { ItemsResponse } from "../types/UtilTypes";
import { generateId } from "../utils/id.utils";

// Instancia del repositorio
const repository = getGenericNameDocRepository();

/**
 * Crear un nuevo nombre genérico
 */
export const createGenericName = async (
  data: CreateGenericNameData
): Promise<GenericNameDoc> => {
  const existing = await repository.findByName(data.name);
  if (existing) {
    throw new Error(`Generic name with name "${data.name}" already exists`);
  }

  const newName: GenericNameDoc = {
    id: generateId(),
    name: data.name,
    aliases: data.aliases,
    description: data.description,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy,
    sincronized: false,
    isDeleted: false,
  };

  return await repository.create(newName);
};

/**
 * Buscar nombre genérico por ID
 */
export const findGenericNameById = async (
  id: string
): Promise<GenericNameDoc | null> => {
  return await repository.findById(id);
};

/**
 * Obtener todos los nombres genéricos
 */
export const findAllGenericNames = async (): Promise<GenericNameDoc[]> => {
  return await repository.findAll();
};

/**
 * Buscar nombre genérico por nombre
 */
export const findGenericNameByName = async (
  name: string
): Promise<GenericNameDoc | null> => {
  return await repository.findByName(name);
};

/**
 * Actualizar nombre genérico
 */
export const updateGenericName = async (
  id: string,
  data: UpdateGenericNameData
): Promise<GenericNameDoc | null> => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Generic name with ID "${id}" not found`);
  }

  if (data.name && data.name !== existing.name) {
    const nameExists = await repository.findByName(data.name);
    if (nameExists) {
      throw new Error(`Generic name with name "${data.name}" already exists`);
    }
  }

  const updateData = {
    ...data,
    sincronized: false,
    updatedAt: new Date().toISOString(),
  };

  await repository.update(id, updateData);
  return await repository.findById(id);
};

/**
 * Eliminar nombre genérico (soft delete)
 */
export const deleteGenericName = async (id: string): Promise<boolean> => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Generic name with ID "${id}" not found`);
  }

  return await repository.delete(id);
};

/**
 * Buscar nombres genéricos por texto
 */
export const searchGenericNames = async (
  query: string
): Promise<GenericNameDoc[]> => {
  return await repository.search(query);
};

/**
 * Obtener nombres genéricos paginados
 */
export const findGenericNamesPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
): Promise<ItemsResponse<GenericNameDoc>> => {
  return await repository.findAllPaginated(page, size, searchQuery);
};
