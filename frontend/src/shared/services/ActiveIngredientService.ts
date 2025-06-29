import type { ActiveIngredient } from '../types/Medication';
import type { CreateActiveIngredientData, UpdateActiveIngredientData } from '../types/MedicationCrud';
import type { ItemsResponse } from '../types/UtilTypes';
import { getActiveIngredientRepository } from '../db/repositories/activeIngredient.repository';
import { generateId } from '../utils/id.utils';

// Instancia global del repository
const repository = getActiveIngredientRepository();

/**
 * Crear un nuevo ingrediente activo
 */
export const createActiveIngredient = async (data: CreateActiveIngredientData): Promise<ActiveIngredient> => {
  // Verificar si ya existe un ingrediente con el mismo nombre
  const existing = await repository.findByName(data.name);
  if (existing) {
    throw new Error(`Active ingredient with name "${data.name}" already exists`);
  }
  
  const newActiveIngredient: ActiveIngredient = {
    id: generateId(),
    name: data.name,
    aliases: data.aliases,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy
  };
  
  return await repository.create(newActiveIngredient);
};

/**
 * Buscar ingrediente activo por ID
 */
export const findActiveIngredientById = async (id: string): Promise<ActiveIngredient | null> => {
  return await repository.findById(id);
};

/**
 * Obtener todos los ingredientes activos
 */
export const findAllActiveIngredients = async (): Promise<ActiveIngredient[]> => {
  return await repository.findAll();
};

/**
 * Buscar ingrediente activo por nombre
 */
export const findActiveIngredientByName = async (name: string): Promise<ActiveIngredient | null> => {
  return await repository.findByName(name);
};

/**
 * Actualizar ingrediente activo
 */
export const updateActiveIngredient = async (id: string, data: UpdateActiveIngredientData): Promise<ActiveIngredient> => {
  // Verificar si existe
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Active ingredient with ID "${id}" not found`);
  }
  
  // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
  if (data.name && data.name !== existing.name) {
    const nameExists = await repository.findByName(data.name);
    if (nameExists) {
      throw new Error(`Active ingredient with name "${data.name}" already exists`);
    }
  }
  
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  const updated = await repository.update(id, updateData);
  if (!updated) {
    throw new Error(`Failed to update active ingredient with ID "${id}"`);
  }
  return updated;
};

/**
 * Eliminar ingrediente activo
 */
export const deleteActiveIngredient = async (id: string): Promise<boolean> => {
  // Verificar si existe
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Active ingredient with ID "${id}" not found`);
  }
  
  return await repository.delete(id);
};

/**
 * Buscar ingredientes activos
 */
export const searchActiveIngredients = async (query: string): Promise<ActiveIngredient[]> => {
  return await repository.search(query);
};

/**
 * Obtener ingredientes activos paginados con búsqueda opcional
 */
export const findActiveIngredientsPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
): Promise<ItemsResponse<ActiveIngredient>> => {
  return await repository.findAllPaginated(page, size, searchQuery);
};
