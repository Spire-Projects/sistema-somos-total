import { getGenericNameDB } from "../db/models/genericName.model";
import type { GenericNameDoc } from "../types/Medication";
import type {
  CreateGenericNameData,
  UpdateGenericNameData,
} from "../types/MedicationCrud";
import { generateId } from "../utils/id.utils";

/**
 * Crear un nuevo nombre genérico
 */
export const createGenericName = async (
  data: CreateGenericNameData
): Promise<GenericNameDoc> => {
  const db = getGenericNameDB();

  // Verificar si ya existe un nombre genérico con el mismo nombre
  const existing = await db.findByName(data.name);
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

  return await db.create(newName);
};

/**
 * Buscar nombre genérico por ID
 */
export const findGenericNameById = async (
  id: string
): Promise<GenericNameDoc | null> => {
  const db = getGenericNameDB();
  return await db.findById(id);
};

/**
 * Obtener todos los nombres genéricos
 */
export const findAllGenericNames = async (): Promise<GenericNameDoc[]> => {
  const db = getGenericNameDB();
  return await db.findAll();
};

/**
 * Buscar nombre genérico por nombre
 */
export const findGenericNameByName = async (
  name: string
): Promise<GenericNameDoc | null> => {
  const db = getGenericNameDB();
  return await db.findByName(name);
};

/**
 * Actualizar nombre genérico
 */
export const updateGenericName = async (
  id: string,
  data: UpdateGenericNameData
): Promise<GenericNameDoc | null> => {
  const db = getGenericNameDB();

  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Generic name with ID "${id}" not found`);
  }

  if (data.name && data.name !== existing.name) {
    const nameExists = await db.findByName(data.name);
    if (nameExists) {
      throw new Error(`Generic name with name "${data.name}" already exists`);
    }
  }

  const updateData = {
    ...data,
    sincronized: false,
    updatedAt: new Date().toISOString(),
  };

  await db.update(id, updateData);
  return await db.findById(id);
};

/**
 * Eliminar nombre genérico (soft delete)
 */
export const deleteGenericName = async (id: string): Promise<boolean> => {
  const db = getGenericNameDB();

  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Generic name with ID "${id}" not found`);
  }

  return await db.delete(id);
};

/**
 * Buscar nombres genéricos por texto
 */
export const searchGenericNames = async (
  query: string
): Promise<GenericNameDoc[]> => {
  const db = getGenericNameDB();
  return await db.search(query);
};
