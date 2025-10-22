import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { Sale } from '../../types/modelTypes/Sale';

// Esquema RxDB para Sale (Ventas simples)
export const salesSchema: RxJsonSchema<Sale> = {
  title: 'sales schema',
  description: 'describes a sale',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    date: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    comprobante: {
      type: 'string',
      maxLength: 100
    },
    productCode: {
      type: 'string',
      maxLength: 100
    },
    client: {
      type: 'string',
      maxLength: 200
    },
    quantity: {
      type: 'number',
      minimum: 1
    },
    unitPrice: {
      type: 'number',
      minimum: 0
    },
    totalPrice: {
      type: 'number',
      minimum: 0
    },
    isDeleted: {
      type: 'boolean'
    },
    sincronized: {
      type: 'boolean'
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
  required: ['id', 'date', 'productCode', 'quantity', 'createdAt', 'createdBy', 'isDeleted', 'sincronized'],
  indexes: [
    // Índices simples
    'productCode',
    'date',
    'client',
    'createdAt',
    'updatedAt',
    'isDeleted',
    'sincronized',
    
    // Índices compuestos optimizados
    ['isDeleted', 'date'],                // Búsqueda de ventas activas por fecha
    ['isDeleted', 'productCode'],         // Búsqueda de ventas activas por producto
    ['isDeleted', 'client'],              // Búsqueda de ventas activas por cliente
    ['isDeleted', 'createdAt'],           // Paginación de ventas activas
    
    // Índices para búsquedas combinadas
    ['isDeleted', 'productCode', 'date'], // Historial de ventas por producto
    ['isDeleted', 'client', 'date'],      // Historial de ventas por cliente
    ['isDeleted', 'updatedAt']            // Ventas eliminadas ordenadas
  ]
};

export const salesMigrationStrategies = {
  1: (oldDoc: any) => {
    return {
      ...oldDoc,
      sincronized: oldDoc.sincronized !== undefined ? oldDoc.sincronized : false
    };
  }
};

export type SalesDocument = RxCollection<Sale>;

// Datos para crear una venta
export interface CreateSaleData {
  id: string;
  date: string;
  productCode: string;
  quantity: number;
  comprobante?: string;
  client?: string;
  unitPrice?: number;
  totalPrice?: number;
  createdBy: string;
}

// Datos para actualizar una venta
export interface UpdateSaleData {
  date?: string;
  comprobante?: string;
  client?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  updatedBy?: string;
}

// Estadísticas de ventas
export interface SalesStatistics {
  totalSales: number;
  activeSales: number;
  deletedSales: number;
  totalRevenueGenerated: number;
  averageRevenuePerSale: number;
  topProductsById: string[];
}
