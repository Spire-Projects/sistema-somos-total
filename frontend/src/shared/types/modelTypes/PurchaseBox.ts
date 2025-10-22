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
  quantity: number;          // Cantidad comprada
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
  quantity: number;
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
  quantity?: number;
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
}

export interface PurchaseStatistics {
  totalPurchases: number;
  activePurchases: number;
  deletedPurchases: number;
  totalCostPurchased: number;
  averageCostPerPurchase: number;
  totalQuantityPurchased: number;
}

/**
 * Filter interfaces
 */
export interface PurchaseFilter {
  hasNotes?: boolean;
  marginMin?: number;
  marginMax?: number;
  unitCostMin?: number;
  unitCostMax?: number;
}