import type { RxJsonSchema,  RxCollection } from 'rxdb';
import type { Manufacturer } from '../../types/Medication';

// Esquema RxDB para Manufacturer
export const manufacturerSchema: RxJsonSchema<Manufacturer> = {
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
    country: {
      type: 'string',
      maxLength: 100
    },
    website: {
      type: 'string',
      maxLength: 300
    },
    contactEmail: {
      type: 'string',
      maxLength: 150
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

export type ManufacturerCollection = RxCollection<Manufacturer>;

