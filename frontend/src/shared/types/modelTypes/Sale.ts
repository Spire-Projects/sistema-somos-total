import type { IEntity } from "../UtilTypes";

export interface SaleItem {
  purchaseBoxId: string; // batch identifier for the medication
  product: string; // product identifier
  quantity: number; // quantity of the medication sold
  unitPrice: number; // final price with discount applied
  discount: number; // optional discount applied to the medication
  total: number; // total price for the quantity sold
}

export interface  Sale extends IEntity {
  items: SaleItem[]; // Array of items sold in the sale
  total: number; // Total amount of the sale
  totalWithoutDiscount?: number; // Total amount without discount, optional
  totalDiscount?: number; // Total discount applied to the sale, optional
  client?: string;  // ID of the client, can be null or empty string if no client
  paymentMethod: 'efectivo' | 'qr' ;
  paymentCurrency: 'bs' | 'arg' ;
  exchangeRateArg?: number; // Exchange rate used if payment currency is 'arg'
  factured?: boolean; // Indicates if the sale has been factured
  nitClient?: string; // Optional NIT of the client for invoicing purposes
  socialReasonClient?: string; // Optional social reason of the client for invoicing purposes
  saleNotes?: string; // Optional notes about the sale
  numberInvoice?: string; // Optional invoice number associated with the sale
}

// CRUD interfaces
export interface CreateSaleData {
  items: SaleItem[];
  total: number;
  totalWithoutDiscount?: number;
  totalDiscount?: number;
  client?: string;
  paymentMethod: 'efectivo' | 'qr' ;
  paymentCurrency: 'bs' | 'arg' ;
  exchangeRateArg?: number;
  factured?: boolean;
  nitClient?: string;
  socialReasonClient?: string;
  saleNotes?: string;
  numberInvoice?: string;
  createdBy: string;
}

export interface UpdateSaleData {
  items?: SaleItem[];
  total?: number;
  totalWithoutDiscount?: number;
  totalDiscount?: number;
  client?: string;
  paymentMethod?: 'efectivo' | 'qr' ;
  paymentCurrency?: 'bs' | 'arg' ;
  exchangeRateArg?: number;
  factured?: boolean;
  nitClient?: string;
  socialReasonClient?: string;
  saleNotes?: string;
  numberInvoice?: string;
  updatedBy?: string;
}

// View interfaces
export interface SaleView extends Sale {
  clientName?: string; // Name of the client, if applicable
}

// Filter interfaces
export interface SaleFilter {
  dateFrom?: string; // Start date for filtering sales
  dateTo?: string;   // End date for filtering sales
  clientId?: string; // Filter by client ID
  factured?: boolean; // Filter by factured status
}

// Types for sale creation modal

/**
 * Extended SaleItem with additional UI state for the cart
 */
export interface CartSaleItem extends SaleItem {
  productName: string; // Name of the product for display
  productCode?: string; // Product code for display
  purchaseDate: string; // Purchase date from purchaseBox
  receiptNumber?: string; // Receipt number from purchaseBox
  availableStock: number; // Available stock in the purchaseBox
  unitCost: number; // Unit cost from purchaseBox
  profitMarginPercentage?: number; // Profit margin percentage
  originalPrice: number; // Calculated selling price before any discounts (unitCost * (1 + profitMargin/100))
}

/**
 * State interface for managing the sale creation process
 */
export interface SaleState {
  // Cart items
  items: CartSaleItem[];
  
  // Client information
  clientId?: string;
  clientName?: string;
  
  // NIT information (optional, for invoicing)
  nitClient?: string;
  socialReasonClient?: string;
  
  // Payment details
  paymentMethod: 'efectivo' | 'qr';
  paymentCurrency: 'bs' | 'arg';
  
  // Discounts
  clientDiscountType: 'percentage' | 'fixed';
  clientDiscountValue: number;
  
  // Totals
  subtotal: number;
  totalDiscount: number;
  total: number;
  
  // Notes
  saleNotes?: string;
}
