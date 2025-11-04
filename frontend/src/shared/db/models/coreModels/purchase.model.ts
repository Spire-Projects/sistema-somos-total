import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { PurchaseBox } from '../../../types/modelTypes/PurchaseBox';

// Esquema RxDB para Purchase
export const purchaseBoxSchema: RxJsonSchema<PurchaseBox> = {
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
    productId: {
      type: 'string',
      maxLength: 100
    },
    purchaseDate: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    receiptNumber: {
      type: 'string',
      maxLength: 100
    },

    quantityPurchased: {
      type: 'number',
      minimum: 1
    },
    quantityAvailable: {
      type: 'number',
      minimum: 0
    },
    unitCost: {
      type: 'number',
      minimum: 0
    },
    totalCost: {
      type: 'number',
      minimum: 0
    },
    supplierId: {
      type: 'string',
      maxLength: 100
    },
    profitMarginPercentage: {
      type: 'number',
      minimum: 0
    },
    notes: {
      type: 'string',
      maxLength: 500
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
  required: ['id', 'productId', 'purchaseDate', 'quantityPurchased','quantityAvailable',  'unitCost', 'totalCost', 'createdAt', 'createdBy', 'isDeleted', 'sincronized'],
  indexes: [
    // Índices simples
    'productId',
    'purchaseDate',
    'supplierId',
    'createdAt',
    'updatedAt',
    'isDeleted',
    'sincronized',
    
    // Índices compuestos optimizados
    ['isDeleted', 'purchaseDate'],        // Búsqueda de compras activas por fecha
    ['isDeleted', 'productId'],           // Búsqueda de compras activas por producto
    ['isDeleted', 'supplierId'],          // Búsqueda de compras activas por proveedor
    ['isDeleted', 'createdAt'],           // Paginación de compras activas
    
    // Índices para búsquedas combinadas
    ['isDeleted', 'productId', 'purchaseDate'], // Historial de compras por producto
    ['isDeleted', 'supplierId', 'purchaseDate'],    // Historial de compras por proveedor
    ['isDeleted', 'updatedAt']            // Compras eliminadas ordenadas
  ]
  ,

};

export const purchaseMigrationStrategies = {};

export type PurchaseDocument = RxCollection<PurchaseBox>;