import type { Manufacturer } from "../types/Medication";
import type {
  CreateManufacturerData,
  UpdateManufacturerData,
} from "../types/MedicationCrud";
import { getManufacturerDB } from "../db/models/manufacturer.model";
import { generateId } from "../utils/id.utils";

/**
 * Crear un nuevo fabricante
 */
export const createManufacturer = async (
  data: CreateManufacturerData
): Promise<Manufacturer> => {
  const db = getManufacturerDB();

  // Verificar si ya existe un fabricante con el mismo nombre
  const existing = await db.findByName(data.name);
  if (existing) {
    throw new Error(`Manufacturer with name "${data.name}" already exists`);
  }

  const newManufacturer: Manufacturer = {
    id: generateId(),
    name: data.name,
    country: data.country,
    website: data.website,
    contactEmail: data.contactEmail,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy,
    sincronized: false,
    isDeleted: false,
  };

  return await db.create(newManufacturer);
};

/**
 * Buscar fabricante por ID
 */
export const findManufacturerById = async (
  id: string
): Promise<Manufacturer | null> => {
  const db = getManufacturerDB();
  return await db.findById(id);
};

/**
 * Obtener todos los fabricantes
 */
export const findAllManufacturers = async (): Promise<Manufacturer[]> => {
  const db = getManufacturerDB();
  return await db.findAll();
};

/**
 * Buscar fabricante por nombre
 */
export const findManufacturerByName = async (
  name: string
): Promise<Manufacturer | null> => {
  const db = getManufacturerDB();
  return await db.findByName(name);
};

/**
 * Actualizar fabricante
 */
export const updateManufacturer = async (
  id: string,
  data: UpdateManufacturerData
): Promise<Manufacturer | null> => {
  const db = getManufacturerDB();

  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Manufacturer with ID "${id}" not found`);
  }

  // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
  if (data.name && data.name !== existing.name) {
    const nameExists = await db.findByName(data.name);
    if (nameExists) {
      throw new Error(`Manufacturer with name "${data.name}" already exists`);
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
 * Eliminar fabricante (soft delete)
 */
export const deleteManufacturer = async (id: string): Promise<boolean> => {
  const db = getManufacturerDB();

  // Verificar si existe
  const existing = await db.findById(id);
  if (!existing) {
    throw new Error(`Manufacturer with ID "${id}" not found`);
  }

  return await db.delete(id);
};

/**
 * Buscar fabricantes
 */
export const searchManufacturers = async (
  query: string
): Promise<Manufacturer[]> => {
  const db = getManufacturerDB();
  return await db.search(query);
};
