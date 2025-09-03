import type { Sale } from '../types/Sales';
import type { ItemsResponse } from '../types/UtilTypes';
import { getSaleRepository } from '../db/repositories/sale.repository';
import { generateId } from '../utils/id.utils';

const repository = getSaleRepository();

/**
 * Limpiar datos de venta para evitar valores undefined que causan problemas en Firestore
 */
export const cleanSaleData = (data: any) => {
  return {
    ...data,
    client: data.client || "",
    idMedic: data.idMedic || "",
    nitClient: data.nitClient || "",
    socialReasonClient: data.socialReasonClient || "",
    saleNotes: data.saleNotes || "",
    totalWithoutDiscount: data.totalWithoutDiscount || 0,
    totalDiscount: data.totalDiscount || 0,
  };
};

/**
 * Crear una venta
 */
export const createSale = async (data: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> => {
  const cleanedData = cleanSaleData(data);
  
  const newSale: Sale = {
    id: generateId(),
    items: cleanedData.items,
    total: cleanedData.total,
    totalWithoutDiscount: cleanedData.totalWithoutDiscount,
    totalDiscount: cleanedData.totalDiscount,
    client: cleanedData.client,
    paymentMethod: cleanedData.paymentMethod,
    createdBy: cleanedData.createdBy,
    createdAt: new Date().toISOString(),
    isDeleted: cleanedData.isDeleted || false,
    sincronized: cleanedData.sincronized || false,
    idMedic: cleanedData.idMedic,
    factured: cleanedData.factured || false,
    nitClient: cleanedData.nitClient,
    socialReasonClient: cleanedData.socialReasonClient,
    saleNotes: cleanedData.saleNotes
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

/**
 * Obtener ventas por rango de fechas
 */
export const findSalesByDateRange = async (
  dateFrom: string,
  dateTo: string
): Promise<Sale[]> => {
  return await repository.findByDateRange(dateFrom, dateTo);
};

/**
 * Obtener ventas por rango de fechas paginadas
 */
export const findSalesByDateRangePaginated = async (
  page: number,
  size: number,
  dateFrom: string,
  dateTo: string,
  searchQuery?: string
): Promise<ItemsResponse<Sale>> => {
  return await repository.findByDateRangePaginated(page, size, dateFrom, dateTo, searchQuery);
};

/**
 * Obtener ventas por estado de facturación
 */
export const findSalesByFacturedStatus = async (factured: boolean): Promise<Sale[]> => {
  return await repository.findByFacturedStatus(factured);
};

/**
 * Obtener ventas por estado de facturación paginadas
 */
export const findSalesByFacturedStatusPaginated = async (
  page: number,
  size: number,
  factured: boolean,
  searchQuery?: string
): Promise<ItemsResponse<Sale>> => {
  return await repository.findByFacturedStatusPaginated(page, size, factured, searchQuery);
};

/**
 * Obtener ventas por rango de fechas y estado de facturación
 */
export const findSalesByDateRangeAndFacturedStatus = async (
  dateFrom: string,
  dateTo: string,
  factured: boolean
): Promise<Sale[]> => {
  return await repository.findByDateRangeAndFacturedStatus(dateFrom, dateTo, factured);
};

/**
 * Obtener ventas por rango de fechas y estado de facturación paginadas
 */
export const findSalesByDateRangeAndFacturedStatusPaginated = async (
  page: number,
  size: number,
  dateFrom: string,
  dateTo: string,
  factured: boolean,
  searchQuery?: string
): Promise<ItemsResponse<Sale>> => {
  return await repository.findByDateRangeAndFacturedStatusPaginated(page, size, dateFrom, dateTo, factured, searchQuery);
};

/**
 * Actualizar estado de facturación de una venta
 */
export const updateSaleFacturedStatus = async (id: string, factured: boolean): Promise<Sale> => {
  const updateData = cleanSaleData({ factured });
  return await repository.update(id, updateData);
};
