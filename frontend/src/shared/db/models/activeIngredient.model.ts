import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { ActiveIngredient } from '../../types/Medication';

// Esquema RxDB para ActiveIngredient
export const activeIngredientSchema: RxJsonSchema<ActiveIngredient> = {
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
    aliases: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 200
      }
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

export type ActiveIngredientCollection = RxCollection<ActiveIngredient>;