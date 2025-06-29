import type { RxJsonSchema, RxCollection } from 'rxdb';
import type { MedicationBatch } from '../../types/Medication';
import { FirestoreMedicationBatchRepository, LocalMedicationBatchRepository, type IMedicationBatchRepository } from '../repositories/medicationBatch.repository';
import { config } from '@/shared/config/config';

// Esquema RxDB para MedicationBatch como entidad independiente
export const medicationBatchSchema: RxJsonSchema<MedicationBatch> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    medicationId: {
      type: 'string',
      maxLength: 100
    },
    batchId: {
      type: 'string',
      maxLength: 100
    },
    expirationDate: {
      type: 'string',
      maxLength: 50
    },
    quantity: {
      type: 'number',
      minimum: 0
    },
    purchasePrice: {
      type: 'number',
      minimum: 0
    },
    sellingPrice: {
      type: 'number',
      minimum: 0
    },
    purchaseDate: {
      type: 'string',
      maxLength: 50
    },
    supplier: {
      type: 'string',
      maxLength: 200
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
  required: ['id', 'medicationId', 'batchId', 'expirationDate', 'quantity', 'purchasePrice', 'sellingPrice'],
  indexes: [
    'medicationId',
    'batchId',
    'expirationDate',
    'purchaseDate',
    'supplier',
    'createdAt',
    ['medicationId', 'expirationDate'], // índice compuesto
    ['medicationId', 'batchId'] // índice compuesto para unicidad
  ]
};

// Tipo para el documento RxDB
export type MedicationBatchDocument = RxCollection<MedicationBatch>;
