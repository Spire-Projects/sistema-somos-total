import type { RxJsonSchema } from 'rxdb';
import type { NumberInvoiceRange } from '../../types/NumberInvoice';

// Esquema RxDB para rangos de números de factura
export const numberInvoiceRangeSchema: RxJsonSchema<NumberInvoiceRange> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    terminalId: {
      type: 'string',
      maxLength: 50,
      description: 'ID único de la terminal'
    },
    range: {
      type: 'array',
      items: {
        type: 'integer'
      },
      minItems: 2,
      maxItems: 2,
      description: 'Rango de números [inicio, fin]'
    },
    size: {
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      multipleOf: 1,
      description: 'Tamaño del rango'
    },
    expiredAt: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      maximum: 9999999999999,
      description: 'Timestamp de expiración'
    },
    used: {
      type: 'integer',
      minimum: 0,
      maximum: 1000,
      multipleOf: 1,
      description: 'Cuántos números se han usado'
    },
    priority: {
      type: 'integer',
      minimum: 0,
      maximum: 999999999,
      multipleOf: 1,
      description: 'Prioridad para asignación (menor = mayor prioridad)'
    },
    numbersUsed: {
      type: 'array',
      items: {
        type: 'integer'
      },
      description: 'Array de números específicos ya usados'
    },
    active: {
      type: 'boolean',
      description: 'Si el rango sigue vigente'
    },
    status: {
      type: 'string',
      maxLength: 20,
      enum: ['active', 'expired', 'completed', 'recycled'],
      description: 'Estado del rango'
    },
    createdAt: {
      type: 'string',
      maxLength: 50,
      format: 'date-time',
      description: 'Timestamp de creación ISO'
    },
    lastUsedAt: {
      type: 'string',
        maxLength: 50,
      format: 'date-time',
      description: 'Timestamp del último uso ISO'
    },
    recycled: {
      type: 'boolean',
      description: 'Si este rango fue reciclado'
    },
    sincronized: {
      type: 'boolean',
      description: 'Si está sincronizado con Firestore'
    }
  },
  required: [
    'id',
    'range', 
    'size',
    'expiredAt',
    'terminalId',
    'used',
    'numbersUsed',
    'active',
    'status',
    'createdAt',
    'recycled',
    'priority'
  ],
  indexes: [
    'terminalId',
    'active',
    'status',
    'expiredAt',
    'priority',
    ['terminalId', 'active'],
    ['active', 'status'],
    ['terminalId', 'active', 'status']
  ]
};

// Estrategias de migración (para futuras versiones)
export const numberInvoiceRangeMigrationStrategies = {
  // Migración de v0 a v1: eliminar campos reservados y obsoletos
  1: function (oldDoc: any) {
    const doc = { ...oldDoc };
    // Eliminar campos reservados
    if ('_lastSyncedAt' in doc) delete doc._lastSyncedAt;
    if ('lastSyncedAt' in doc) delete doc.lastSyncedAt;
    return doc;
  }
};

export type NumberInvoiceRangeDocument = NumberInvoiceRange;