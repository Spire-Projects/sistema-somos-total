import type { RxJsonSchema } from 'rxdb';
import type { Client } from '../../types/Client';

// Esquema para RxDB
export const clientSchema: RxJsonSchema<Client> = {
  title: 'client schema',
  description: 'describes a client',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string',
      maxLength: 200
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 100
    },
   
    phone: {
      type: 'string',
      maxLength: 50
    },
    address: {
      type: 'string',
      maxLength: 500
    },
    sincronized: {
      type: 'boolean'
    },
    isDeleted: {
      type: 'boolean'
    },
    salesHistory: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
   
    lastPurchaseDate: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    createdBy: {
      type: 'string',
      maxLength: 100
    },
    updatedBy: {
      type: 'string',
      maxLength: 100
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    }
  },
  required: ['id', 'name', 'createdAt', 'updatedAt', 'isDeleted', 'sincronized'],
  indexes: [
    'name',
    'email', 
    'createdAt',
    'updatedAt',
    'isDeleted',
    'sincronized',
    ['isDeleted', 'createdAt'], // Índice compuesto para paginación de activos
    ['isDeleted', 'name'],      // Índice compuesto para búsqueda de activos por nombre
    ['isDeleted', 'email'],     // Índice compuesto para búsqueda de activos por email
    ['isDeleted', 'updatedAt']  // Índice compuesto para clientes eliminados ordenados
  ]
};

export const clientMigrationStrategies = {
 
  1: (oldDoc: any) => {
    const { nit, loyaltyPoints, ...rest } = oldDoc;
    return rest;
  },
};

// Datos para crear un cliente
export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdBy?: string;
}

// Datos para actualizar un cliente
export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  updatedBy?: string;
}

// Estadísticas de clientes
export interface ClientStatistics {
  totalClients: number;
  activeClients: number;
  deletedClients: number;
  recentClients: number; // últimos 30 días
}