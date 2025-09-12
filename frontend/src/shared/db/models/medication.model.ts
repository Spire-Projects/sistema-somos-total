import type { RxJsonSchema } from 'rxdb';
import type { Medication } from '../../types/Medication';
// Esquema RxDB para Medication
export const medicationSchema: RxJsonSchema<Medication> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    comercialName: {
      type: 'string',
      maxLength: 300
    },

    tradeName: {
      type: 'string',
      maxLength: 300
    },
    genericName: {
      type: 'string',
      maxLength: 300
    },
    activeIngredientIds: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 100
      }
    },
    pharmaceuticalFormId: {
      type: 'string',
      maxLength: 100
    },
    concentration: {
      type: 'string',
      maxLength: 100
    },
    presentation: {
      type: 'string',
      maxLength: 200
    },
    manufacturerId: {
      type: 'string',
      maxLength: 100
    },
    categoryId: {
      type: 'string',
      maxLength: 100
    },
    barcode: {
      type: 'string',
      maxLength: 50
    },
    description: {
      type: 'string',
      maxLength: 1000
    },
    indications: {
      type: 'string',
      maxLength: 1000
    },
    warnings: {
      type: 'string',
      maxLength: 1000
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
    },
    prescriptionRequired: {
      type: 'boolean'
    }
  },
  required: ['id', 'tradeName', 'genericName', 'activeIngredientIds', 'pharmaceuticalFormId', 'concentration', 'presentation', 'manufacturerId', 'categoryId', 'comercialName', 'isDeleted', 'prescriptionRequired'],
  indexes: [
    // Índices simples existentes
    'tradeName', 
    'genericName', 
    'barcode', 
    'categoryId', 
    'manufacturerId', 
    'createdAt',
    'isDeleted',
    
    // Índices compuestos optimizados para el catálogo de medicamentos
    ['isDeleted', 'categoryId'],           // Filtro por categoría
    ['isDeleted', 'manufacturerId'],       // Filtro por fabricante  
    ['isDeleted', 'pharmaceuticalFormId'], // Filtro por forma farmacéutica
    ['isDeleted', 'tradeName'],           // Búsqueda por nombre comercial
    ['isDeleted', 'genericName'],         // Búsqueda por nombre genérico
    ['isDeleted', 'createdAt'],           // Ordenamiento por fecha de creación
    ['isDeleted', 'barcode'],             // Búsqueda por código de barras
    
    // Índices compuestos para consultas complejas frecuentes
    ['isDeleted', 'categoryId', 'manufacturerId'],     // Filtro combinado categoría + fabricante
    ['isDeleted', 'categoryId', 'createdAt'],          // Filtro categoría + ordenamiento fecha
    ['isDeleted', 'manufacturerId', 'createdAt']       // Filtro fabricante + ordenamiento fecha
  ]
};

export const medicationMigrationStrategies = {
 
  1: (oldDoc: any) => {
    return {
      ...oldDoc,
      prescriptionRequired: false 
    };
  },
  
};
