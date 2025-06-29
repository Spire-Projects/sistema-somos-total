import type { Manufacturer } from "../types/Medication";
import type {
  CreateManufacturerData,
  UpdateManufacturerData,
} from "../types/MedicationCrud";
import type { ItemsResponse } from "../types/UtilTypes";
import { getManufacturerRepository } from "../db/repositories/manufacturer.repository";
import { generateId } from "../utils/id.utils";

// Instancia global del repository
const repository = getManufacturerRepository();

/**
 * Crear un nuevo fabricante
 */
export const createManufacturer = async (
  data: CreateManufacturerData
): Promise<Manufacturer> => {
  // Verificar si ya existe un fabricante con el mismo nombre
  const existing = await repository.findByName(data.name);
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

  return await repository.create(newManufacturer);
};

/**
 * Buscar fabricante por ID
 */
export const findManufacturerById = async (
  id: string
): Promise<Manufacturer | null> => {
  return await repository.findById(id);
};

/**
 * Obtener todos los fabricantes
 */
export const findAllManufacturers = async (): Promise<Manufacturer[]> => {
  return await repository.findAll();
};

/**
 * Buscar fabricante por nombre
 */
export const findManufacturerByName = async (
  name: string
): Promise<Manufacturer | null> => {
  return await repository.findByName(name);
};

/**
 * Actualizar fabricante
 */
export const updateManufacturer = async (
  id: string,
  data: UpdateManufacturerData
): Promise<Manufacturer | null> => {
  // Verificar si existe
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Manufacturer with ID "${id}" not found`);
  }

  // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
  if (data.name && data.name !== existing.name) {
    const nameExists = await repository.findByName(data.name);
    if (nameExists) {
      throw new Error(`Manufacturer with name "${data.name}" already exists`);
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
 * Eliminar fabricante (soft delete)
 */
export const deleteManufacturer = async (id: string): Promise<boolean> => {
  // Verificar si existe
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Manufacturer with ID "${id}" not found`);
  }

  return await repository.delete(id);
};

/**
 * Buscar fabricantes
 */
export const searchManufacturers = async (
  query: string
): Promise<Manufacturer[]> => {
  return await repository.search(query);
};

/**
 * Obtener fabricantes paginados con búsqueda opcional
 */
export const findManufacturersPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
): Promise<ItemsResponse<Manufacturer>> => {
  return await repository.findAllPaginated(page, size, searchQuery);
};
