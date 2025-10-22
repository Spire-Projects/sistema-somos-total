import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { Product } from '../../types/modelTypes/Product';

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
    name: {
      type: 'string',
      maxLength: 200
    },
    category: {
      type: 'string',
      maxLength: 100
    },
    stock: {
      type: 'number',
      minimum: 0
    },
    unitCost: {
      type: 'number',
      minimum: 0
    },
    unitPrice: {
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
  required: ['code', 'name', 'createdAt', 'createdBy', 'isDeleted', 'sincronized'],
  indexes: [
    // Índices simples (se excluye 'code' pues es primaryKey)
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

export const productMigrationStrategies = {
  1: (oldDoc: any) => {
    return {
      ...oldDoc,
      stock: oldDoc.stock || 0,
      sincronized: oldDoc.sincronized !== undefined ? oldDoc.sincronized : false
    };
  }
};

export type ProductDocument = RxCollection<Product>;

// Datos para crear un producto
export interface CreateProductData {
  code: string;
  name: string;
  category?: string;
  stock?: number;
  unitCost?: number;
  unitPrice?: number;
  createdBy: string;
}

// Datos para actualizar un producto
export interface UpdateProductData {
  name?: string;
  category?: string;
  stock?: number;
  unitCost?: number;
  unitPrice?: number;
  updatedBy?: string;
}

// Estadísticas de productos
export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  deletedProducts: number;
  totalStock: number;
  lowStockProducts: number; // stock < 10
}
