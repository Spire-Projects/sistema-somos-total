import type { RxJsonSchema, RxDatabase, RxCollection } from 'rxdb';
import type { PharmaceuticalFormDoc } from '../../types/Medication';
import { config } from '../../config/config';

// Esquema RxDB para PharmaceuticalForm
export const pharmaceuticalFormSchema: RxJsonSchema<PharmaceuticalFormDoc> = {
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
    },
    sincronized: {
      type: 'boolean'
    },
    isDeleted: {
      type: 'boolean'
    }
  },
  required: ['id', 'name'],
  indexes: ['name', 'createdAt']
};

export type PharmaceuticalFormCollection = RxCollection<PharmaceuticalFormDoc>;
