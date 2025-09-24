import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { Medic } from '../../types/Sales';

// Esquema RxDB para Medic
export const medicSchema: RxJsonSchema<Medic> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    fullName: {
      type: 'string',
      maxLength: 200
    },
    licenseNumber: {
      type: 'string',
      maxLength: 50
    },
    specialty: {
      type: 'string',
      maxLength: 100,
    },
    isDeleted: {
      type: 'boolean'
    },
    sincronized: {
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
  required: ['id', 'fullName', 'licenseNumber', 'isDeleted', 'sincronized', 'createdAt', 'createdBy'],
  indexes: [
    // Índices simples
    'fullName',
    'licenseNumber',
    'isDeleted',
    'createdAt',
    
    // Índices compuestos optimizados
    ['isDeleted', 'fullName'],           // Búsqueda por nombre
    ['isDeleted', 'licenseNumber'],      // Búsqueda por licencia
    ['isDeleted', 'createdAt'],          // Ordenamiento por fecha
    
    // Índices para búsquedas combinadas
    ['isDeleted', 'fullName', 'licenseNumber'],  // Búsqueda completa
    ['fullName', 'licenseNumber'],               // Validación unicidad
  ]
};


export const medicMigrationStrategies = {
  1: (oldDoc: any) => {
    return {
      ...oldDoc,
      specialty: "General",
    };
  },
};


export type MedicDocument = RxCollection<Medic>;
