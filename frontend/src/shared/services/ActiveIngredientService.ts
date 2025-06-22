import type { ActiveIngredient } from '../types/Medication';
import type { CreateActiveIngredientData, UpdateActiveIngredientData } from '../types/MedicationCrud';
import { getActiveIngredientDB } from '../db/models/activeIngredient.model';
import { generateId } from '../utils/id.utils';

/**
 * Crear un nuevo ingrediente activo
 */
export const createActiveIngredient = async (data: CreateActiveIngredientData): Promise<ActiveIngredient> => {
  const db = getActiveIngredientDB();
  
  // Verificar si ya existe un ingrediente con el mismo nombre
  const existing = await db.findByName(data.name);
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
  
  return await db.create(newActiveIngredient);
};

/**
 * Buscar ingrediente activo por ID
 */
export const findActiveIngredientById = async (id: string): Promise<ActiveIngredient | null> => {
  const db = getActiveIngredientDB();
  return await db.findById(id);
};

/**
 * Obtener todos los ingredientes activos
 */
export const findAllActiveIngredients = async (): Promise<ActiveIngredient[]> => {
  const db = getActiveIngredientDB();
  return await db.findAll();
};

/**
 * Buscar ingrediente activo por nombre
 */
export const findActiveIngredientByName = async (name: string): Promise<ActiveIngredient | null> => {
  const db = getActiveIngredientDB();
  return await db.findByName(name);
};

/**
 * Actualizar ingrediente activo
 */
export const updateActiveIngredient = async (id: string, data: UpdateActiveIngredientData): Promise<ActiveIngredient> => {
  const db = getActiveIngredientDB();
  
  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Active ingredient with ID "${id}" not found`);
  }
  
  // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
  if (data.name && data.name !== existing.name) {
    const nameExists = await db.findByName(data.name);
    if (nameExists) {
      throw new Error(`Active ingredient with name "${data.name}" already exists`);
    }
  }
  
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  return await db.update(id, updateData);
};

/**
 * Eliminar ingrediente activo
 */
export const deleteActiveIngredient = async (id: string): Promise<boolean> => {
  const db = getActiveIngredientDB();
  
  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Active ingredient with ID "${id}" not found`);
  }
  
  return await db.delete(id);
};

/**
 * Buscar ingredientes activos
 */
export const searchActiveIngredients = async (query: string): Promise<ActiveIngredient[]> => {
  const db = getActiveIngredientDB();
  return await db.search(query);
};
