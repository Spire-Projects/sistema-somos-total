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
  required: ['id', 'numberNit', 'socialReason', 'sincronized','isDeleted' , 'createdAt', 'updatedAt'],
  indexes: ['numberNit', 'socialReason', 'isDeleted', 'createdAt', 'updatedAt', 'isDeleted'],
};

export const nitMigrationStrategies = {
  1: (oldDoc: any) => {
    return {
      ...oldDoc,
      sincronized: typeof oldDoc.sincronized === 'boolean' ? oldDoc.sincronized : false,
      _deleted: typeof oldDoc._deleted === 'boolean' ? oldDoc._deleted : false,
      createdBy: oldDoc.createdBy || '',
      updatedBy: oldDoc.updatedBy || '',
      deletedBy: oldDoc.deletedBy || '',
      createdAt: oldDoc.createdAt || new Date().toISOString(),
      updatedAt: oldDoc.updatedAt || new Date().toISOString(),
      deletedAt: oldDoc.deletedAt || '',
    };
  },
};

export type NITCollection = RxCollection<NIT>;
