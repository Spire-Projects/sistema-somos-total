import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { Category } from '../../../types/modelTypes/Category';

// Esquema RxDB para Category
export const categorySchema: RxJsonSchema<Category> = {
  title: 'category schema',
  description: 'describes a category',
  version: 0,
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
  required: ['id', 'name', 'createdAt', 'createdBy', 'isDeleted', 'sincronized'],
  indexes: [
    // Índices simples
    'name',
    'createdAt',
    'updatedAt',
    'isDeleted',
    'sincronized',
    
    // Índices compuestos optimizados
    ['isDeleted', 'name'],                // Búsqueda de activas por nombre
    ['isDeleted', 'createdAt'],           // Paginación de activas
    ['isDeleted', 'updatedAt']            // Categorías eliminadas ordenadas
  ]
};

export const categoryMigrationStrategies = {};

export type CategoryDocument = RxCollection<Category>;
