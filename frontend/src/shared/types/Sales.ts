import type { MedicationBatch } from './Medication';

export interface SaleItem {
  batchId: string;
  medicationId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Medic {
  id: string; // Unique identifier for the medic
  fullName: string; // Full name of the medic
  licenseNumber: string; // License number of the medic
  isDeleted?: boolean; // Indicates if the medic is deleted
  sincronized?: boolean; // Indicates if the medic is synchronized with the server
  createdAt?: string; // ISO date string when created
  createdBy?: string; // ID of the user who created the medic
  updatedAt?: string; // ISO date string when last updated
  updatedBy?: string; // ID of the user who last updated the medic
}

export interface Sale {
  id: string; // Unique identifier for the sale
  items: SaleItem[]; // Array of items sold in the sale
  total: number; // Total amount of the sale
  client?: string;  // ID of the client, can be null or empty string if no client
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  createdAt: string; // ISO date string
  createdBy: string; // ID of the user who created the sale
  isDeleted?: boolean; // Indicates if the sale is deleted
  sincronized?: boolean; // Indicates if the sale is synchronized with the server
  idMedic?: string; // Medic information associated with the sale
  factured?: boolean; // Indicates if the sale has been factured
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
