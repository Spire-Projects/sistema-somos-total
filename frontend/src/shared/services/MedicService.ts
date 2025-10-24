import type { Medic } from '../types/modelTypes/Sale';
import type { ItemsResponse } from '../types/UtilTypes';
import { getMedicRepository } from '../db/repositories/medic.repository';
import type { CreateMedicData, UpdateMedicData } from '../db/repositories/medic.repository';

const repository = getMedicRepository();

/**
 * Crear un médico
 */
export const createMedic = async (data: CreateMedicData): Promise<Medic> => {
  // Validar que no exista el número de licencia
  const licenseExists = await repository.licenseNumberExists(data.licenseNumber);
  if (licenseExists) {
    throw new Error(`License number "${data.licenseNumber}" already exists`);
  }

  return await repository.create(data);
};

/**
 * Buscar médico por ID
 */
export const findMedicById = async (id: string): Promise<Medic | null> => {
  return await repository.findById(id);
};

/**
 * Actualizar médico
 */
export const updateMedic = async (id: string, data: UpdateMedicData): Promise<Medic> => {
  // Si se está actualizando el número de licencia, validar que no exista
  if (data.licenseNumber) {
    const licenseExists = await repository.licenseNumberExists(data.licenseNumber, id);
    if (licenseExists) {
      throw new Error(`License number "${data.licenseNumber}" already exists`);
    }
  }

  return await repository.update(id, data);
};

/**
 * Eliminar médico (soft delete)
 */
export const deleteMedic = async (id: string): Promise<void> => {
  return await repository.delete(id);
};

/**
 * Obtener todos los médicos
 */
export const findAllMedics = async (): Promise<Medic[]> => {
  return await repository.findAll();
};

/**
 * Obtener médicos paginados
 */
export const findMedicsPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
): Promise<ItemsResponse<Medic>> => {
  return await repository.findAllPaginated(page, size, searchQuery);
};

/**
 * Buscar médicos por nombre o licencia
 */
export const searchMedicsByNameOrLicense = async (searchQuery: string): Promise<Medic[]> => {
  return await repository.searchByNameOrLicense(searchQuery);
};

/**
 * Buscar médicos por nombre o licencia (paginado)
 */
export const searchMedicsByNameOrLicensePaginated = async (
  searchQuery: string,
  page: number,
  size: number
): Promise<ItemsResponse<Medic>> => {
  return await repository.searchByNameOrLicensePaginated(searchQuery, page, size);
};

/**
 * Validar si existe un número de licencia
 */
export const validateLicenseNumber = async (licenseNumber: string, excludeId?: string): Promise<boolean> => {
  return await repository.licenseNumberExists(licenseNumber, excludeId);
};

/**
 * Validar si existe un nombre completo
 */
export const validateFullName = async (fullName: string, excludeId?: string): Promise<boolean> => {
  return await repository.fullNameExists(fullName, excludeId);
};
