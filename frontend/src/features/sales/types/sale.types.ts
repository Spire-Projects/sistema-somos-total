import type { PurchaseBox } from '@/shared/types/modelTypes/PurchaseBox';

/**
 * Item de venta individual con toda la información necesaria
 */
export interface SaleItem {
  id: string; // ID único temporal para el item en el carrito
  purchaseBoxId: string; // ID del purchaseBox del cual se está vendiendo
  productId: string; // ID del producto
  productName: string; // Nombre del producto para mostrar
  productCode: string; // Código del producto
  batchCode: string; // Código del lote (purchaseBox)
  availableStock: number; // Stock disponible en este purchaseBox
  quantity: number; // Cantidad a vender
  unitPrice: number; // Precio unitario de venta
  discountPercentage: number; // Descuento porcentual (0-100)
  discountAmount: number; // Monto del descuento calculado
  subtotal: number; // Subtotal sin descuento (unitPrice * quantity)
  total: number; // Total con descuento aplicado
  addedAt: string; // Timestamp de cuando se agregó
}

/**
 * Información del purchaseBox para el selector de productos
 */
export interface PurchaseBoxForSale extends PurchaseBox {
  productName?: string;
  productCode?: string;
  availableStock?: number; // Cantidad disponible para vender (quantity sin vender)
}

/**
 * Estado completo del modal de venta
 */
export interface SaleState {
  // Items en el carrito
  items: SaleItem[];
  
  // Cliente
  clientId?: string;
  clientName?: string;
  
  // NIT (opcional)
  nitClient?: string;
  socialReasonClient?: string;
  
  // Médico (opcional) - para recetas
  medicId?: string;
  medicName?: string;
  
  // Notas de la venta
  saleNotes?: string;
  
  // Método de pago
  paymentMethod: 'efectivo' | 'qr';
  paymentCurrency: 'Bs' | 'ARS';
  
  // Descuento global al cliente
  clientDiscountType: 'percentage' | 'fixed';
  clientDiscountValue: number;
  
  // Totales calculados
  subtotalBeforeDiscount: number; // Suma de todos los subtotales
  itemsDiscountTotal: number; // Suma de descuentos de items individuales
  clientDiscountAmount: number; // Descuento global calculado
  totalSaved: number; // Total ahorrado (itemsDiscountTotal + clientDiscountAmount)
  total: number; // Total final a pagar
  
  // Facturación
  factured: boolean;
}

/**
 * Datos para crear una venta
 */
export interface CreateSalePayload {
  items: Array<{
    productId: string;
    purchaseBoxId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  total: number;
  paymentMethod: string;
  paymentCurrency: 'Bs' | 'ARS';
  factured: boolean;
  client?: string;
  nitClient?: string;
  socialReasonClient?: string;
  medicId?: string;
  saleNotes?: string;
}

/**
 * Información de venta completada para mostrar en el modal de éxito
 */
export interface CompletedSaleInfo {
  numberInvoice: string;
  date: string;
  clientName?: string;
  nitClient?: string;
  socialReasonClient?: string;
  items: SaleItem[];
  paymentMethod: string;
  paymentCurrency: 'Bs' | 'ARS';
  subtotal: number;
  discounts: number;
  total: number;
  factured: boolean;
}

