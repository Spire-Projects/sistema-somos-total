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
  
  // Validar que no exista un cliente con el mismo email o NIT
  const existingEmail = await repository.findByEmail(clientData.email);
  if (existingEmail) {
    throw new Error('Ya existe un cliente con este email');
  }

  const existingNit = await repository.findByNit(clientData.nit);
  if (existingNit) {
    throw new Error('Ya existe un cliente con este NIT');
  }

  const now = new Date().toISOString();
  return await repository.create({
    ...clientData,
    createdAt: now,
    updatedAt: now,
    loyaltyPoints: clientData.loyaltyPoints || 0,
    salesHistory: []
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
 * Obtener cliente por NIT
 */
export const getClientByNit = async (nit: string): Promise<Client | null> => {
  const repository = getRepository();
  return await repository.findByNit(nit);
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
  
  // Si se está actualizando email o NIT, validar que no existan duplicados
  if (updateData.email) {
    const existingEmail = await repository.findByEmail(updateData.email);
    if (existingEmail && existingEmail.id !== id) {
      throw new Error('Ya existe un cliente con este email');
    }
  }

  if (updateData.nit) {
    const existingNit = await repository.findByNit(updateData.nit);
    if (existingNit && existingNit.id !== id) {
      throw new Error('Ya existe un cliente con este NIT');
    }
  }

  return await repository.update(id, {
    ...updateData,
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
 * Actualizar puntos de fidelidad
 */
export const updateClientLoyaltyPoints = async (clientId: string, points: number): Promise<Client | null> => {
  if (points < 0) {
    throw new Error('Los puntos de fidelidad no pueden ser negativos');
  }

  const repository = getRepository();
  return await repository.updateLoyaltyPoints(clientId, points);
};

/**
 * Agregar puntos de fidelidad (suma a los existentes)
 */
export const addLoyaltyPoints = async (clientId: string, pointsToAdd: number): Promise<Client | null> => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error('Cliente no encontrado');
  }

  const currentPoints = client.loyaltyPoints || 0;
  const newPoints = currentPoints + pointsToAdd;

  if (newPoints < 0) {
    throw new Error('Los puntos resultantes no pueden ser negativos');
  }

  return await updateClientLoyaltyPoints(clientId, newPoints);
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
 * Obtener nivel de fidelidad basado en puntos
 */
export const getLoyaltyLevel = (points: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  if (points >= 1000) return 'platinum';
  if (points >= 500) return 'gold';
  if (points >= 100) return 'silver';
  return 'bronze';
};

/**
 * Obtener color del badge de nivel de fidelidad
 */
export const getLoyaltyLevelColor = (level: string): string => {
  switch (level) {
    case 'platinum':
      return 'bg-purple-100 text-purple-800';
    case 'gold':
      return 'bg-yellow-100 text-yellow-800';
    case 'silver':
      return 'bg-gray-100 text-gray-800';
    case 'bronze':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Obtener texto del nivel de fidelidad
 */
export const getLoyaltyLevelText = (level: string): string => {
  switch (level) {
    case 'platinum':
      return 'Platino';
    case 'gold':
      return 'Oro';
    case 'silver':
      return 'Plata';
    case 'bronze':
      return 'Bronce';
    default:
      return 'Sin nivel';
  }
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