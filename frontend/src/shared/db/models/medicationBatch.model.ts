import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { MedicationBatch } from '../../types/Medication';

// Esquema RxDB para MedicationBatch como entidad independiente
export const medicationBatchSchema: RxJsonSchema<MedicationBatch> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    medicationId: {
      type: 'string',
      maxLength: 100
    },
    batchId: {
      type: 'string',
      maxLength: 100
    },
    expirationDate: {
      type: 'string',
      maxLength: 50
    },
    quantity: {
      type: 'number',
      minimum: 0,
      maximum: 1000000, // Valor máximo razonable para un inventario
      multipleOf: 1 // Requerido para índices en campos numéricos
    },
    purchasePrice: {
      type: 'number',
      minimum: 0,
      maximum: 10000000, // Valor máximo razonable para un precio de compra
      multipleOf: 0.01 // Precisión de dos decimales para precios
    },
    sellingPrice: {
      type: 'number',
      minimum: 0,
      maximum: 10000000, // Valor máximo razonable para un precio de venta
      multipleOf: 0.01 // Precisión de dos decimales para precios
    },
    purchaseDate: {
      type: 'string',
      maxLength: 50
    },
    supplier: {
      type: 'string',
      maxLength: 200
    },
    sincronized: {
      type: 'boolean'
    },
    isDeleted: {
      type: 'boolean'
    },
    createdAt: {
      type: 'string',
      maxLength: 50
    },
    createdBy: {
      type: 'string',
      maxLength: 100
    },
    updatedAt: {
      type: 'string',
      maxLength: 50
    },
    updatedBy: {
      type: 'string',
      maxLength: 100
    }
  },
  required: ['id', 'medicationId', 'batchId', 'expirationDate', 'quantity', 'purchasePrice', 'sellingPrice', 'isDeleted'],
  indexes: [
    // Índices simples existentes
    'medicationId',
    'batchId',
    'expirationDate',
    'purchaseDate',
    'supplier',
    'createdAt',
    'isDeleted',
    'quantity',
    
    // Índices compuestos existentes
    ['medicationId', 'expirationDate'],
    ['medicationId', 'batchId'],
    
    // Nuevos índices compuestos optimizados para el catálogo
    ['isDeleted', 'medicationId'],              // Consultas por medicamento
    ['isDeleted', 'expirationDate'],            // Filtros de vencimiento
    ['isDeleted', 'quantity'],                  // Filtros de stock
    ['isDeleted', 'purchaseDate'],              // Filtros por fecha de compra
    ['isDeleted', 'supplier'],                  // Filtros por proveedor
    
    // Índices compuestos para filtros combinados del catálogo
    ['isDeleted', 'medicationId', 'quantity'],            // Stock por medicamento
    ['isDeleted', 'medicationId', 'expirationDate'],      // Vencimiento por medicamento
    ['isDeleted', 'quantity', 'expirationDate'],          // Stock + vencimiento
    ['isDeleted', 'medicationId', 'quantity', 'expirationDate'], // Consulta completa catálogo
    
    // Índices para agregaciones de stock
    ['medicationId', 'isDeleted', 'quantity'],            // Suma de stock por medicamento
    ['medicationId', 'isDeleted', 'expirationDate', 'quantity'] // Análisis completo por medicamento
  ]
};

// Tipo para el documento RxDB
export type MedicationBatchDocument = RxCollection<MedicationBatch>;
