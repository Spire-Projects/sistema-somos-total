import type { MedicationBatch } from './Medication';

export interface BatchWithMedication extends MedicationBatch {
  medication: {
    id: string;
    tradeName: string;
    genericName: string;
    concentration: string;
    presentation: string;
  };
}

export interface CreateBatchData {
  medicationId: string;
  batchId: string;
  expirationDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  purchaseDate?: string;
  supplier?: string;
  createdBy: string;
}

export interface BatchFilter {
  dateFrom?: string;
  dateTo?: string;
  medicationId?: string;
}

export type BatchSortField = 'purchaseDate' | 'expirationDate' | 'tradeName' | 'quantity' | 'purchasePrice' | 'sellingPrice';
export type SortDirection = 'asc' | 'desc';
