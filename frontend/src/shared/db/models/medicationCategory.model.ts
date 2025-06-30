import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { MedicationCategory } from '../../types/Medication';
// Esquema RxDB para MedicationCategory
export const medicationCategorySchema: RxJsonSchema<MedicationCategory> = {
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
    createdAt: {
      type: 'string',
      maxLength: 50
    },
    createdBy: {
      type: 'string',
      maxLength: 100
    }
  },
  required: ['id', 'name'],
  indexes: ['name', 'createdAt']
};

export type MedicationCategoryCollection = RxCollection<MedicationCategory>;
