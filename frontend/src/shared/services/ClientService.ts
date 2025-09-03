import type { Client } from '../types/Client';
import type { CreateClientData, UpdateClientData, ClientStatistics } from '../db/models/client.model';
import type { ItemsResponse } from '../types/UtilTypes';
import { getClientRepository } from '../db/repositories/client.repository';

/**
 * Obtener instancia del repositorio
 */
const getRepository = () => getClientRepository();

/**
 * Crear un nuevo cliente
 */
export const createClient = async (clientData: CreateClientData): Promise<Client> => {
  const repository = getRepository();
  
  // Validar que no exista un cliente con el mismo email solo si está presente y no está vacío
  if (clientData.email && clientData.email.trim() !== "") {
    const existingEmail = await repository.findByEmail(clientData.email);
    if (existingEmail) {
      throw new Error('Ya existe un cliente con este email');
    }
  }

  const now = new Date().toISOString();
  return await repository.create({
    ...clientData,
    // Asegurar que los campos opcionales sean strings vacíos en lugar de undefined
    email: clientData.email?.trim() || "",
    phone: clientData.phone?.trim() || "",
    address: clientData.address?.trim() || "",
    createdAt: now,
    updatedAt: now,
    salesHistory: [],
    sincronized: false,
    isDeleted: false
  });
};

/**
 * Obtener cliente por ID
 */
export const getClientById = async (id: string): Promise<Client | null> => {
  const repository = getRepository();
  return await repository.findById(id);
};

/**
 * Obtener cliente por email
 */
export const getClientByEmail = async (email: string): Promise<Client | null> => {
  const repository = getRepository();
  return await repository.findByEmail(email);
};

/**
 * Obtener todos los clientes
 */
export const getAllClients = async (): Promise<Client[]> => {
  const repository = getRepository();
  return await repository.findAll();
};

/**
 * Obtener clientes paginados con búsqueda opcional
 */
export const getAllClientsPaginated = async (
  page: number = 1, 
  size: number = 10, 
  searchQuery?: string
): Promise<ItemsResponse<Client>> => {
  const repository = getRepository();
  return await repository.findAllPaginated(page, size, searchQuery);
};

/**
 * Actualizar cliente
 */
export const updateClient = async (id: string, updateData: UpdateClientData): Promise<Client | null> => {
  const repository = getRepository();
  
  // Si se está actualizando email, validar que no existan duplicados solo si está presente y no está vacío
  if (updateData.email && updateData.email.trim() !== "") {
    const existingEmail = await repository.findByEmail(updateData.email);
    if (existingEmail && existingEmail.id !== id) {
      throw new Error('Ya existe un cliente con este email');
    }
  }

  return await repository.update(id, {
    ...updateData,
    // Asegurar que los campos opcionales sean strings vacíos en lugar de undefined
    email: updateData.email?.trim() || "",
    phone: updateData.phone?.trim() || "",
    address: updateData.address?.trim() || "",
    updatedAt: new Date().toISOString()
  });
};

/**
 * Eliminar cliente (soft delete)
 */
export const deleteClient = async (id: string): Promise<boolean> => {
  const repository = getRepository();
  return await repository.delete(id);
};

/**
 * Eliminar cliente con usuario que lo eliminó
 */
export const softDeleteClient = async (id: string, deletedBy: string): Promise<boolean> => {
  const repository = getRepository();
  return await repository.softDelete(id, deletedBy);
};

/**
 * Restaurar cliente eliminado
 */
export const restoreClient = async (id: string): Promise<boolean> => {
  const repository = getRepository();
  return await repository.restore(id);
};

/**
 * Agregar venta al historial del cliente
 */
export const addSaleToClientHistory = async (clientId: string, saleId: string): Promise<Client | null> => {
  const repository = getRepository();
  return await repository.addSaleToHistory(clientId, saleId);
};

/**
 * Obtener historial de ventas del cliente
 * TODO: Implementar cuando tengas la lógica de ventas
 */
export const getClientSalesHistory = async (clientId: string): Promise<string[]> => {
  const repository = getRepository();
  return await repository.getClientSales(clientId);
};

/**
 * Obtener estadísticas de clientes
 */
export const getClientStatistics = async (): Promise<ClientStatistics> => {
  const repository = getRepository();
  return await repository.getStatistics();
};

/**
 * Obtener clientes activos
 */
export const getActiveClients = async (): Promise<Client[]> => {
  const repository = getRepository();
  return await repository.getActiveClients();
};

/**
 * Obtener clientes eliminados
 */
export const getDeletedClients = async (): Promise<Client[]> => {
  const repository = getRepository();
  return await repository.getDeletedClients();
};

/**
 * Funciones helper para la UI
 */

/**
 * Formatear nombre completo del cliente
 */
export const formatClientName = (client: Client): string => {
  return client.name.trim();
};

/**
 * Formatear información de contacto
 */
export const formatClientContact = (client: Client): string => {
  const parts = [client.email];
  if (client.phone) {
    parts.push(client.phone);
  }
  return parts.join(' • ');
};

/**
 * Calcular días desde la última compra
 */
export const getDaysSinceLastPurchase = (lastPurchaseDate?: string): number | null => {
  if (!lastPurchaseDate) return null;
  const today = new Date();
  const lastPurchase = new Date(lastPurchaseDate);
  const diffTime = today.getTime() - lastPurchase.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verificar si el cliente es frecuente (ha comprado en los últimos 30 días)
 */
export const isFrequentClient = (client: Client): boolean => {
  if (!client.lastPurchaseDate) return false;
  const daysSinceLastPurchase = getDaysSinceLastPurchase(client.lastPurchaseDate);
  return daysSinceLastPurchase !== null && daysSinceLastPurchase <= 30;
};