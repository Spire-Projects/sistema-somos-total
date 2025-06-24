import type { PharmaceuticalFormDoc } from "../types/Medication";
import type {
  CreatePharmaceuticalFormData,
  UpdatePharmaceuticalFormData,
} from "../types/MedicationCrud";
import { getPharmaceuticalFormDB } from "../db/models/pharmaceuticalForm.model";
import { generateId } from "../utils/id.utils";

/**
 * Crear una nueva forma farmacéutica
 */
export const createPharmaceuticalForm = async (
  data: CreatePharmaceuticalFormData
): Promise<PharmaceuticalFormDoc> => {
  const db = getPharmaceuticalFormDB();

  // Verificar si ya existe una forma farmacéutica con el mismo nombre
  const existing = await db.findByName(data.name);
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

  return await db.create(newForm);
};

/**
 * Buscar forma farmacéutica por ID
 */
export const findPharmaceuticalFormById = async (
  id: string
): Promise<PharmaceuticalFormDoc | null> => {
  const db = getPharmaceuticalFormDB();
  return await db.findById(id);
};

/**
 * Obtener todas las formas farmacéuticas
 */
export const findAllPharmaceuticalForms = async (): Promise<
  PharmaceuticalFormDoc[]
> => {
  const db = getPharmaceuticalFormDB();
  return await db.findAll();
};

/**
 * Buscar forma farmacéutica por nombre
 */
export const findPharmaceuticalFormByName = async (
  name: string
): Promise<PharmaceuticalFormDoc | null> => {
  const db = getPharmaceuticalFormDB();
  return await db.findByName(name);
};

/**
 * Actualizar forma farmacéutica
 */
export const updatePharmaceuticalForm = async (
  id: string,
  data: UpdatePharmaceuticalFormData
): Promise<PharmaceuticalFormDoc | null> => {
  const db = getPharmaceuticalFormDB();

  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Pharmaceutical form with ID "${id}" not found`);
  }

  // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
  if (data.name && data.name !== existing.name) {
    const nameExists = await db.findByName(data.name);
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

  await db.update(id, updateData);
  return await db.findById(id);
};

/**
 * Eliminar forma farmacéutica (soft delete)
 */
export const deletePharmaceuticalForm = async (
  id: string
): Promise<boolean> => {
  const db = getPharmaceuticalFormDB();

  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Pharmaceutical form with ID "${id}" not found`);
  }

  return await db.delete(id);
};

/**
 * Buscar formas farmacéuticas
 */
export const searchPharmaceuticalForms = async (
  query: string
): Promise<PharmaceuticalFormDoc[]> => {
  const db = getPharmaceuticalFormDB();
  return await db.search(query);
};
