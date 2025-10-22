import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { Purchase } from '../../types/modelTypes/Purchase';

// Esquema RxDB para Purchase
export const purchaseSchema: RxJsonSchema<Purchase> = {
  title: 'purchase schema',
  description: 'describes a purchase',
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
    supplier: {
      type: 'string',
      maxLength: 200
    },
    quantity: {
      type: 'number',
      minimum: 1
    },
    unitCost: {
      type: 'number',
      minimum: 0
    },
    totalCost: {
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
    'supplier',
    'createdAt',
    'updatedAt',
    'isDeleted',
    'sincronized',
    
    // Índices compuestos optimizados
    ['isDeleted', 'date'],                // Búsqueda de compras activas por fecha
    ['isDeleted', 'productCode'],         // Búsqueda de compras activas por producto
    ['isDeleted', 'supplier'],            // Búsqueda de compras activas por proveedor
    ['isDeleted', 'createdAt'],           // Paginación de compras activas
    
    // Índices para búsquedas combinadas
    ['isDeleted', 'productCode', 'date'], // Historial de compras por producto
    ['isDeleted', 'supplier', 'date'],    // Historial de compras por proveedor
    ['isDeleted', 'updatedAt']            // Compras eliminadas ordenadas
  ]
};

export const purchaseMigrationStrategies = {
  1: (oldDoc: any) => {
    return {
      ...oldDoc,
      sincronized: oldDoc.sincronized !== undefined ? oldDoc.sincronized : false
    };
  }
};

export type PurchaseDocument = RxCollection<Purchase>;

// Datos para crear una compra
export interface CreatePurchaseData {
  id: string;
  date: string;
  productCode: string;
  quantity: number;
  comprobante?: string;
  supplier?: string;
  unitCost?: number;
  totalCost?: number;
  createdBy: string;
}

// Datos para actualizar una compra
export interface UpdatePurchaseData {
  date?: string;
  comprobante?: string;
  supplier?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
  updatedBy?: string;
}

// Estadísticas de compras
export interface PurchaseStatistics {
  totalPurchases: number;
  activePurchases: number;
  deletedPurchases: number;
  totalCostPurchased: number;
  averageCostPerPurchase: number;
}
