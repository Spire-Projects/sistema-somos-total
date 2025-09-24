import type { MedicationBatch } from './Medication';

export interface SaleItem {
  batchId: string; // batch identifier for the medication
  medicationId: string; // medication identifier
  quantity: number; // quantity of the medication sold
  unitPrice: number; // final price with discount applied
  listPrice?: number; // optional list price of the medication
  discount?: number; // optional discount applied to the medication
  total: number; // total price for the quantity sold
}

export interface Medic {
  id: string; // Unique identifier for the medic
  fullName: string; // Full name of the medic
  licenseNumber: string; // License number of the medic
  specialty?: string; // Specialty of the medic
  isDeleted?: boolean; // Indicates if the medic is deleted
  sincronized?: boolean; // Indicates if the medic is synchronized with the server
  createdAt?: string; // ISO date string when created
  createdBy?: string; // ID of the user who created the medic
  updatedAt?: string; // ISO date string when last updated
  updatedBy?: string; // ID of the user who last updated the medic
}

export interface  Sale {
  id: string; // Unique identifier for the sale
  items: SaleItem[]; // Array of items sold in the sale
  total: number; // Total amount of the sale
  totalWithoutDiscount?: number; // Total amount without discount, optional
  totalDiscount?: number; // Total discount applied to the sale, optional
  client?: string;  // ID of the client, can be null or empty string if no client
  paymentMethod: 'efectivo' | 'qr' ;
  createdAt: string; // ISO date string
  createdBy: string; // ID of the user who created the sale
  isDeleted?: boolean; // Indicates if the sale is deleted
  sincronized?: boolean; // Indicates if the sale is synchronized with the server
  idMedic?: string; // Medic information associated with the sale
  factured?: boolean; // Indicates if the sale has been factured
  nitClient?: string; // Optional NIT of the client for invoicing purposes
  socialReasonClient?: string; // Optional social reason of the client for invoicing purposes
  saleNotes?: string; // Optional notes about the sale
  numberInvoice?: string; // Optional invoice number associated with the sale
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
