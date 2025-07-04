import type { MedicationBatch } from './Medication';

export interface SaleItem {
  batchId: string;
  medicationId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  items: Array<{
    batchId: string;
    medicationId: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  total: number;
  client: string; // Cambia a `string` para evitar `undefined`
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  createdAt: number;
  createdBy: string;
}

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
