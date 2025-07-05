import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

export interface SaleItem {
  id: string; // ID único del item en la venta
  medication: MedicationCatalogView;
  batchId: string; // ID del lote específico seleccionado (ahora obligatorio)
  medicationId: string; // ID del medicamento para compatibilidad con la interfaz principal
  quantity: number;
  unitPrice: number; // Precio final con descuento aplicado (precio de venta)
  listPrice?: number; // Precio original del producto
  discount?: number; // Descuento aplicado en dinero
  total: number; // quantity * unitPrice (subtotal del item)
  batchInfo: {
    batchId: string; // Código del lote (user-defined)
    expirationDate: string;
    availableStock: number; // Stock disponible en este lote específico
    daysToExpiration: number;
  };
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
