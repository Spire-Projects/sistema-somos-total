import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { NIT } from '@/shared/types/Nit';

// Esquema RxDB para NIT
export const nitSchema: RxJsonSchema<NIT> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    numberNit: {
      type: 'string',
      maxLength: 50
    },
    socialReason: {
      type: 'string',
      maxLength: 200
    },
    sincronized: {
      type: 'boolean',
      default: false
    },
    isDeleted: {
      type: 'boolean',
      default: false
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
    },
  },
  required: ['id', 'numberNit', 'socialReason', 'sincronized','isDeleted' , 'createdAt'],
  indexes: ['numberNit', 'socialReason', 'isDeleted', 'createdAt', 'updatedAt', 'isDeleted'],
};



export type NITCollection = RxCollection<NIT>;
