import type { Sale, SaleItem } from '../types/Sales';
import type { ItemsResponse } from '../types/UtilTypes';
import { getSaleRepository } from '../db/repositories/sale.repository';
import { generateId } from '../utils/id.utils';

const repository = getSaleRepository();

/**
 * Crear una venta
 */
export const createSale = async (data: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> => {
  const newSale: Sale = {
    id: generateId(),
    items: data.items,
    total: data.total,
    client: data.client,
    paymentMethod: data.paymentMethod,
    createdBy: data.createdBy,
    createdAt: Date.now()
  };

  return await repository.create(newSale);
};

/**
 * Buscar venta por ID
 */
export const findSaleById = async (id: string): Promise<Sale | null> => {
  return await repository.findById(id);
};

/**
 * Obtener todas las ventas
 */
export const findAllSales = async (): Promise<Sale[]> => {
  return await repository.findAll();
};

/**
 * Eliminar venta
 */
export const deleteSale = async (id: string): Promise<boolean> => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Sale with ID "${id}" not found`);
  }

  return await repository.delete(id);
};

/**
 * Buscar ventas por cliente o medicamento
 */
export const searchSales = async (query: string): Promise<Sale[]> => {
  return await repository.search(query);
};

/**
 * Obtener ventas paginadas
 */
export const findSalesPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
): Promise<ItemsResponse<Sale>> => {
  return await repository.findAllPaginated(page, size, searchQuery);
};
