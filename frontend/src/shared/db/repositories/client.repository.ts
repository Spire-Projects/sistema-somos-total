import type { Client } from '../../types/Client';
import type { ClientStatistics } from '../models/client.model';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';

export interface IClientRepository {
  create(clientData: Omit<Client, 'id'>): Promise<Client>;
  findById(id: string): Promise<Client | null>;
  findByEmail(email: string): Promise<Client | null>;
  findByNit(nit: string): Promise<Client | null>;
  findAll(): Promise<Client[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Client>>;
  update(id: string, updateData: Partial<Client>): Promise<Client | null>;
  delete(id: string): Promise<boolean>;
  addSaleToHistory(clientId: string, saleId: string): Promise<Client | null>;
  updateLoyaltyPoints(clientId: string, points: number): Promise<Client | null>;
  getClientSales(clientId: string): Promise<string[]>;
  getStatistics(): Promise<ClientStatistics>;
  getActiveClients(): Promise<Client[]>;
  getDeletedClients(): Promise<Client[]>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
}

export class LocalClientRepository implements IClientRepository {
  async create(clientData: Omit<Client, 'id'>): Promise<Client> {
    const db = await initDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const client = await db.clients.insert({ 
      id, 
      ...clientData,
      createdAt: now,
      updatedAt: now,
      sincronized: false,
      isDeleted: false
    });
    return JSON.parse(JSON.stringify(client.toJSON())) as Client;
  }

  async findById(id: string): Promise<Client | null> {
    const db = await initDatabase();
    const client = await db.clients.findOne(id).exec();
    return client ? JSON.parse(JSON.stringify(client.toJSON())) as Client : null;
  }

  async findByEmail(email: string): Promise<Client | null> {
    const db = await initDatabase();
    const client = await db.clients.findOne({ 
      selector: { 
        isDeleted: false,
        email
      },
      sort: [{ isDeleted: 'asc', email: 'asc' }]
    }).exec();
    return client ? JSON.parse(JSON.stringify(client.toJSON())) as Client : null;
  }

  async findByNit(nit: string): Promise<Client | null> {
    const db = await initDatabase();
    const client = await db.clients.findOne({ 
      selector: { 
        isDeleted: false,
        nit
      },
      sort: [{ isDeleted: 'asc', nit: 'asc' }]
    }).exec();
    return client ? JSON.parse(JSON.stringify(client.toJSON())) as Client : null;
  }

  async findAll(): Promise<Client[]> {
    const db = await initDatabase();
    const clients = await db.clients.find({
      selector: { 
        isDeleted: false 
      },
      sort: [{ isDeleted: 'asc', createdAt: 'desc' }]
    }).exec();
    return clients.map((client) => JSON.parse(JSON.stringify(client.toJSON())) as Client);
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Client>> {
    const db = await initDatabase();
    
    const selector = { isDeleted: false };
    
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      Object.assign(selector, {
        $or: [
          { name: { $regex: normalizedText, $options: 'i' } },
          { email: { $regex: normalizedText, $options: 'i' } },
          { nit: { $regex: normalizedText, $options: 'i' } },
          { phone: { $regex: normalizedText, $options: 'i' } },
          { address: { $regex: normalizedText, $options: 'i' } }
        ]
      });
    }

    // Estrategia optimizada: obtener solo los datos necesarios para paginación
    const skip = (page - 1) * size;
    const limit = size + 1; // +1 para saber si hay más páginas
    
    const clients = await db.clients.find({
      selector,
      sort: [{ isDeleted: 'asc', createdAt: 'desc' }],
      skip,
      limit
    }).exec();

    const items = clients.slice(0, size).map((client) => 
      JSON.parse(JSON.stringify(client.toJSON())) as Client
    );
    
    const hasMore = clients.length > size;
    
    // Estimación inteligente del total sin usar count()
    let totalItems: number;
    let totalPages: number;
    
    if (page === 1 && !hasMore) {
      // Primera página y no hay más: el total es exacto
      totalItems = items.length;
      totalPages = 1;
    } else if (page === 1 && hasMore) {
      // Primera página con más datos: estimamos basado en el patrón
      totalItems = Math.max(size * 3, skip + size + 10); // Estimación conservadora
      totalPages = Math.ceil(totalItems / size);
    } else {
      // Páginas posteriores: estimamos basado en la posición actual
      totalItems = hasMore ? skip + size + 10 : skip + items.length;
      totalPages = Math.ceil(totalItems / size);
    }

    return {
      items,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async update(id: string, updateData: Partial<Client>): Promise<Client | null> {
    const db = await initDatabase();
    const client = await db.clients.findOne(id).exec();
    if (!client) return null;
    await client.update({ 
      $set: { 
        ...updateData, 
        updatedAt: new Date().toISOString() 
      } 
    });
    return JSON.parse(JSON.stringify(client.toJSON())) as Client;
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const client = await db.clients.findOne(id).exec();
    if (!client) return false;
    
    // Soft delete
    await client.update({
      $set: {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      }
    });
    return true;
  }

  async addSaleToHistory(clientId: string, saleId: string): Promise<Client | null> {
    const db = await initDatabase();
    const client = await db.clients.findOne(clientId).exec();
    if (!client) return null;
    
    const clientData = client.toJSON();
    const salesHistory = clientData.salesHistory || [];
    
    await client.update({ 
      $set: { 
        salesHistory: [...salesHistory, saleId],
        lastPurchaseDate: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      } 
    });
    
    return JSON.parse(JSON.stringify(client.toJSON())) as Client;
  }

  async updateLoyaltyPoints(clientId: string, points: number): Promise<Client | null> {
    const db = await initDatabase();
    const client = await db.clients.findOne(clientId).exec();
    if (!client) return null;
    
    await client.update({ 
      $set: { 
        loyaltyPoints: points,
        updatedAt: new Date().toISOString() 
      } 
    });
    
    return JSON.parse(JSON.stringify(client.toJSON())) as Client;
  }

  async getClientSales(clientId: string): Promise<string[]> {
    const client = await this.findById(clientId);
    return client?.salesHistory || [];
  }

  async getStatistics(): Promise<ClientStatistics> {
    const db = await initDatabase();
    // Total de clientes
    const totalClients = await db.clients.find().exec();
    // Activos
    const activeClientsDocs = await db.clients.find({ selector: { isDeleted: false } }).exec();
    // Eliminados
    const deletedClientsDocs = await db.clients.find({ selector: { isDeleted: true } }).exec();

    const activeClients = activeClientsDocs.map((c) => JSON.parse(JSON.stringify(c.toJSON())) as Client);
    const deletedClients = deletedClientsDocs.map((c) => JSON.parse(JSON.stringify(c.toJSON())) as Client);

    // Puntos de fidelidad
    const totalLoyaltyPoints = activeClients.reduce((sum, client) => sum + (client.loyaltyPoints || 0), 0);
    const averageLoyaltyPoints = activeClients.length > 0 ? totalLoyaltyPoints / activeClients.length : 0;

    // Top clientes por puntos
    const topClientsByPoints = activeClients
      .filter(c => c.loyaltyPoints && c.loyaltyPoints > 0)
      .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        loyaltyPoints: c.loyaltyPoints || 0
      }));

    // Clientes de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentClients = activeClients.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;

    return {
      totalClients: totalClients.length,
      activeClients: activeClients.length,
      deletedClients: deletedClients.length,
      averageLoyaltyPoints,
      topClientsByPoints,
      recentClients
    };
  }

  async getActiveClients(): Promise<Client[]> {
    const db = await initDatabase();
    const clients = await db.clients.find({
      selector: {
        isDeleted: false
      },
      sort: [{ isDeleted: 'asc', name: 'asc' }]
    }).exec();
    return clients.map((client) => JSON.parse(JSON.stringify(client.toJSON())) as Client);
  }

  async getDeletedClients(): Promise<Client[]> {
    const db = await initDatabase();
    const clients = await db.clients.find({
      selector: {
        isDeleted: true
      },
      sort: [{ isDeleted: 'asc', updatedAt: 'desc' }]
    }).exec();
    return clients.map((client) => JSON.parse(JSON.stringify(client.toJSON())) as Client);
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const db = await initDatabase();
    const client = await db.clients.findOne(id).exec();
    if (!client) return false;
    
    await client.update({ 
      $set: { 
        isDeleted: true, 
        updatedBy: deletedBy,
        updatedAt: new Date().toISOString() 
      } 
    });
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const db = await initDatabase();
    const client = await db.clients.findOne(id).exec();
    if (!client) return false;
    
    await client.update({ 
      $set: { 
        isDeleted: false,
        updatedAt: new Date().toISOString() 
      } 
    });
    return true;
  }
}

export class FirestoreClientRepository implements IClientRepository {
  async create(_clientData: Omit<Client, 'id'>): Promise<Client> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByEmail(_email: string): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByNit(_nit: string): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<Client[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<Client>> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<Client>): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async addSaleToHistory(_clientId: string, _saleId: string): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async updateLoyaltyPoints(_clientId: string, _points: number): Promise<Client | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async getClientSales(_clientId: string): Promise<string[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async getStatistics(): Promise<ClientStatistics> {
    throw new Error('Firestore implementation not yet available');
  }
  async getActiveClients(): Promise<Client[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async getDeletedClients(): Promise<Client[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async softDelete(_id: string, _deletedBy: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async restore(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localClientRepository = new LocalClientRepository();
export const firestoreClientRepository = new FirestoreClientRepository();

export const getClientRepository = (): IClientRepository => {
  return config.APP_MODE === 'local' ? localClientRepository : firestoreClientRepository;
};
