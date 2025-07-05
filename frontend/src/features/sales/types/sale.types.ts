import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

export interface SaleItem {
  id: string; // ID único del item en la venta
  medication: MedicationCatalogView;
  quantity: number;
  unitPrice: number; // Precio por unidad
  totalPrice: number; // quantity * unitPrice
  batchId?: string; // ID del lote específico seleccionado
  addedAt: string; // Timestamp de cuando se agregó
}

export interface SaleState {
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  clientId?: string;
  clientName?: string;
}

export interface NewSaleFormData {
  clientId?: string;
  clientName?: string;
  items: SaleItem[];
  notes?: string;
}
