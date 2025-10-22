import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { Product } from '../../../types/modelTypes/Product';


// Esquema RxDB para Product
export const productSchema: RxJsonSchema<Product> = {
  title: 'product schema',
  description: 'describes a product',
  version: 0,
  primaryKey: 'code',
  type: 'object',
  properties: {
    code: {
      type: 'string',
      maxLength: 100
    },
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string',
      maxLength: 200
    },
    category: {
      type: 'string',
      maxLength: 100
    },
    description: {
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
  required: ['code', 'id', 'name', 'createdAt', 'createdBy', 'isDeleted', 'sincronized'],
  indexes: [
    // Índices simples (se excluye 'code' pues es primaryKey)
    'id',
    'name',
    'category',
    'createdAt',
    'updatedAt',
    'isDeleted',
    'sincronized',
    
    // Índices compuestos optimizados
    ['isDeleted', 'name'],                // Búsqueda de activos por nombre
    ['isDeleted', 'category'],            // Búsqueda de activos por categoría
    ['isDeleted', 'createdAt'],           // Paginación de activos
    
    // Índices para búsquedas combinadas
    ['isDeleted', 'category', 'name'],    // Búsqueda por categoría y nombre
    ['isDeleted', 'updatedAt']            // Productos eliminados ordenados
  ]
};

export const productMigrationStrategies = {};

export type ProductDocument = RxCollection<Product>;