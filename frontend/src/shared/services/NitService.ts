import type { NIT } from '../types/Nit';
import type { ItemsResponse } from '../types/UtilTypes';
import { getNitRepository } from '../db/repositories/nit.repository';

/**
 * Tipos específicos para el servicio de NIT
 */
export interface CreateNitData {
  numberNit: string;
  socialReason: string;
}

export interface UpdateNitData {
  numberNit?: string;
  socialReason?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface NitStatistics {
  totalNits: number;
  activeNits: number;
  deletedNits: number;
  recentNits: number;
}

/**
 * Obtener instancia del repositorio
 */
const getRepository = () => getNitRepository();

/**
 * Crear un nuevo NIT
 */
export const createNit = async (nitData: CreateNitData): Promise<NIT> => {
  const repository = getRepository();
  
  // Validar que no exista un NIT con el mismo número
  const existingNit = await repository.findByNumberNit(nitData.numberNit);
  if (existingNit) {
    throw new Error('Ya existe un NIT con este número');
  }

  // Validar que no exista un NIT con la misma razón social
  const existingSocialReason = await repository.findBySocialReason(nitData.socialReason);
  if (existingSocialReason) {
    throw new Error('Ya existe un NIT con esta razón social');
  }

  const now = new Date().toISOString();
  return await repository.create({
    ...nitData,
    // Asegurar que los campos sean strings limpios
    numberNit: nitData.numberNit.trim(),
    socialReason: nitData.socialReason.trim(),
    sincronized: false,
    _deleted: false,
    createdAt: now,
    updatedAt: now
  });
};

/**
 * Obtener NIT por ID
 */
export const getNitById = async (id: string): Promise<NIT | null> => {
  const repository = getRepository();
  return await repository.findById(id);
};

/**
 * Obtener NIT por número
 */
export const getNitByNumber = async (numberNit: string): Promise<NIT | null> => {
  const repository = getRepository();
  return await repository.findByNumberNit(numberNit);
};

/**
 * Obtener NIT por razón social
 */
export const getNitBySocialReason = async (socialReason: string): Promise<NIT | null> => {
  const repository = getRepository();
  return await repository.findBySocialReason(socialReason);
};

/**
 * Obtener todos los NITs
 */
export const getAllNits = async (): Promise<NIT[]> => {
  const repository = getRepository();
  return await repository.findAll();
};

/**
 * Obtener NITs paginados con búsqueda opcional
 */
export const getAllNitsPaginated = async (
  page: number = 1, 
  size: number = 10, 
  searchQuery?: string
): Promise<ItemsResponse<NIT>> => {
  const repository = getRepository();
  return await repository.findAllPaginated(page, size, searchQuery);
};

/**
 * Actualizar NIT
 */
export const updateNit = async (id: string, updateData: UpdateNitData): Promise<NIT | null> => {
  const repository = getRepository();
  
  // Si se está actualizando el número de NIT, validar que no existan duplicados
  if (updateData.numberNit) {
    const existingNit = await repository.findByNumberNit(updateData.numberNit);
    if (existingNit && existingNit.id !== id) {
      throw new Error('Ya existe un NIT con este número');
    }
  }

  // Si se está actualizando la razón social, validar que no existan duplicados
  if (updateData.socialReason) {
    const existingSocialReason = await repository.findBySocialReason(updateData.socialReason);
    if (existingSocialReason && existingSocialReason.id !== id) {
      throw new Error('Ya existe un NIT con esta razón social');
    }
  }

  return await repository.update(id, {
    ...updateData,
    // Asegurar que los campos sean strings limpios
    numberNit: updateData.numberNit?.trim(),
    socialReason: updateData.socialReason?.trim(),
    updatedAt: new Date().toISOString()
  });
};

/**
 * Eliminar NIT (soft delete)
 */
export const deleteNit = async (id: string): Promise<boolean> => {
  const repository = getRepository();
  return await repository.delete(id);
};

/**
 * Eliminar NIT con usuario que lo eliminó
 */
export const softDeleteNit = async (id: string, deletedBy: string): Promise<boolean> => {
  const repository = getRepository();
  return await repository.softDelete(id, deletedBy);
};

/**
 * Restaurar NIT eliminado
 */
export const restoreNit = async (id: string): Promise<boolean> => {
  const repository = getRepository();
  return await repository.restore(id);
};

/**
 * Obtener estadísticas de NITs
 */
export const getNitStatistics = async (): Promise<NitStatistics> => {
  const repository = getRepository();
  const allNits = await repository.findAll();
  const activeNits = await repository.getActiveNits();
  const deletedNits = await repository.getDeletedNits();

  // NITs de los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentNits = activeNits.filter(nit => 
    (nit as any).createdAt && new Date((nit as any).createdAt) >= thirtyDaysAgo
  ).length;

  return {
    totalNits: allNits.length + deletedNits.length,
    activeNits: activeNits.length,
    deletedNits: deletedNits.length,
    recentNits
  };
};

/**
 * Obtener NITs activos
 */
export const getActiveNits = async (): Promise<NIT[]> => {
  const repository = getRepository();
  return await repository.getActiveNits();
};

/**
 * Obtener NITs eliminados
 */
export const getDeletedNits = async (): Promise<NIT[]> => {
  const repository = getRepository();
  return await repository.getDeletedNits();
};

/**
 * Funciones helper para la UI
 */

/**
 * Formatear información completa del NIT
 */
export const formatNitInfo = (nit: NIT): string => {
  return `${nit.numberNit} - ${nit.socialReason}`;
};

/**
 * Formatear número de NIT
 */
export const formatNitNumber = (numberNit: string): string => {
  // Remover caracteres no numéricos excepto guiones
  const cleaned = numberNit.replace(/[^\d\-]/g, '');
  return cleaned;
};

/**
 * Validar formato de número de NIT
 */
export const validateNitNumber = (numberNit: string): boolean => {
  // Validación básica: debe tener al menos 7 dígitos
  const cleanNumber = numberNit.replace(/[^\d]/g, '');
  return cleanNumber.length >= 7 && cleanNumber.length <= 15;
};

/**
 * Validar razón social
 */
export const validateSocialReason = (socialReason: string): boolean => {
  // Debe tener al menos 3 caracteres y no estar vacío
  return socialReason.trim().length >= 3;
};

/**
 * Buscar NITs por texto (número o razón social)
 */
export const searchNits = async (searchText: string): Promise<NIT[]> => {
  const repository = getRepository();
  const allNits = await repository.getActiveNits();
  
  const normalizedSearch = searchText.toLowerCase().trim();
  
  return allNits.filter(nit => 
    nit.numberNit.toLowerCase().includes(normalizedSearch) ||
    nit.socialReason.toLowerCase().includes(normalizedSearch)
  );
};
