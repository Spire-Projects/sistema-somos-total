import type { IEntity } from "../UtilTypes";
import type { ProductView } from "./Product";

/**
 * Modelo de Compra/Entrada de Inventario
 * Registra todas las compras de productos a proveedores
 */
export interface PurchaseBox extends IEntity {
  productId: string;         // Código/ID del producto
  purchaseDate: string;      // Fecha de compra (ISO)
  receiptNumber?: string;    // Número de comprobante/factura
  quantityPurchased: number;          // Cantidad comprada
  quantityAvailable: number;      // Cantidad disponible de esta compra
  unitCost: number;          // Costo unitario
  totalCost: number;         // Costo total (quantity * unitCost)
  supplierId?: string;       // ID del Proveedor
  profitMarginPercentage?: number; // Porcentaje de margen de ganancia
  notes?: string;            // Notas adicionales
}

/**
 * CRUD interfaces
 */
export interface CreatePurchaseData {
  productId: string;
  purchaseDate: string;
  receiptNumber?: string;
  quantityPurchased: number;
  unitCost: number;
  totalCost: number;
  supplierId?: string;
  profitMarginPercentage?: number;
  notes?: string;
  createdBy: string;
}

export interface UpdatePurchaseData {
  productId?: string;
  purchaseDate?: string;
  receiptNumber?: string;
  quantityPurchased?: number;
  quantityAvailable?: number;
  unitCost?: number;
  totalCost?: number;
  supplierId?: string;
  profitMarginPercentage?: number;
  notes?: string;
  updatedBy?: string;
}

/**
 * View interfaces
 */
export interface PurchaseView extends PurchaseBox {
  product: ProductView;
  supplierName?: string;
  productCode?: string;
  productName?: string;
  productCategory?: string;
}

/**
 * Filter interfaces
 */
export interface PurchaseFilter {
  hasNotes?: boolean;
  productId?: string;
  supplierId?: string;
}