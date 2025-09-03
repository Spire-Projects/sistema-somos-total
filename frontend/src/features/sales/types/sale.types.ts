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
  subtotal: number; // Suma total con precio final (con descuento por producto)
  amountWithDiscount: number; // Suma de productos que tienen descuento
  amountWithoutDiscount: number; // Suma de productos sin descuento
  clientDiscount?: {
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  };
  totalSaved: number; // Total ahorrado
  total: number; // Total final a cobrar
  clientId?: string;
  clientName?: string;
  medicId?: string;
  medicName?: string;
  nitClient?: string; // NIT del cliente para facturación
  socialReasonClient?: string; // Razón social del cliente para facturación
  saleNotes?: string; // Notas de la venta
  paymentMethod: 'efectivo' | 'qr' ;
}

export interface NewSaleFormData {
  clientId?: string;
  clientName?: string;
  items: SaleItem[];
  notes?: string;
}
