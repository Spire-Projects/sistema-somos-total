import type { Sale } from '@/shared/types/modelTypes/Sale';
import type { RxJsonSchema, RxCollection } from 'rxdb';


// Esquema RxDB para Sale (Ventas simples)
export const salesSchema: RxJsonSchema<Sale> = {
  title: 'sales schema',
  description: 'describes a sale',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          purchaseBoxId: { type: 'string', maxLength: 100 },
          product: { type: 'string', maxLength: 100 },
          quantity: { type: 'number', minimum: 1 },
          unitPrice: { type: 'number', minimum: 0 },
          discount: { type: 'number', minimum: 0 },
          total: { type: 'number', minimum: 0 }
        },
        required: ['purchaseBoxId', 'product', 'quantity', 'unitPrice', 'discount', 'total']
      }
    },
    total: { type: 'number', minimum: 0 },
    totalWithoutDiscount: { type: 'number', minimum: 0 },
    totalDiscount: { type: 'number', minimum: 0 },
    client: { type: 'string', maxLength: 200 },
    paymentMethod: { type: 'string', enum: ['efectivo', 'qr'], maxLength: 20 },
    paymentCurrency: { type: 'string', enum: ['bs', 'arg'], maxLength: 10 },
    exchangeRateArg: { type: 'number', minimum: 0 },
    factured: { type: 'boolean' },
    nitClient: { type: 'string', maxLength: 50 },
    socialReasonClient: { type: 'string', maxLength: 200 },
    saleNotes: { type: 'string', maxLength: 500 },
    numberInvoice: { type: 'string', maxLength: 50 },
    isDraft: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    sincronized: { type: 'boolean' },
    createdBy: { type: 'string', maxLength: 100 },
    updatedBy: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string', format: 'date-time', maxLength: 50 },
    updatedAt: { type: 'string', format: 'date-time', maxLength: 50 }
  },
  required: [
    'id',
    'items',
    'total',
    'paymentMethod',
    'paymentCurrency',
    'createdAt',
    'createdBy',
    'isDeleted',
    'sincronized',
    'factured',
    'isDraft'
  ],
  indexes: [
    'client',
    'createdAt',
    'updatedAt',
    'isDeleted',
    'isDraft',
    'sincronized',
    ['isDeleted', 'createdAt'],
    ['isDeleted', 'client'],
    ['isDeleted', 'updatedAt'],
    ['isDeleted', 'paymentMethod'],
    ['isDeleted', 'paymentCurrency'],
    ['isDeleted', 'factured'],
    ['isDeleted', 'isDraft'],
    ['isDeleted', 'createdBy'],
    ['isDeleted', 'client', 'createdAt']
  ]
};


export const salesMigrationStrategies = {
  // Migración de v0 a v1: eliminar campos reservados y obsoletos
  1: function (oldDoc: any) {
    const doc = { ...oldDoc, isDraft: false };
    return doc;
  }
};


export type SalesDocument = RxCollection<Sale>;
