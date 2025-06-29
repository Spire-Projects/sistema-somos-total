import type { RxJsonSchema } from 'rxdb';
import type { Medication } from '../../types/Medication';
import { config } from '../../config/config';
import { FirestoreMedicationDB, LocalMedicationDB, type IMedicationRepository } from '../repositories/medication.repository';


// Esquema RxDB para Medication
export const medicationSchema: RxJsonSchema<Medication> = {
  version: 0,
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
    }
  },
  required: ['id', 'tradeName', 'genericName', 'activeIngredientIds', 'pharmaceuticalFormId', 'concentration', 'presentation', 'manufacturerId', 'categoryId', 'comercialName'],
  indexes: ['tradeName', 'genericName', 'barcode', 'categoryId', 'manufacturerId', 'createdAt']
};
