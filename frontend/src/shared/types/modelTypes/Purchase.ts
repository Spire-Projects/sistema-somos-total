export interface Purchase {
  id: string;                // UUID
  date: string;              // Fecha (ISO)
  comprobante?: string;      // Nro de comprobante o factura
  productCode: string;       // Referencia a Product.code
  supplier?: string;         // Proveedor
  quantity: number;          // Cantidad comprada
  unitCost?: number;         // Costo unitario
  totalCost?: number;        // Costo total
  createdBy: string;         // Usuario que creó el registro
  updatedBy?: string;        // Último usuario que lo modificó
  isDeleted: boolean;        // Borrado lógico
  sincronized: boolean;      // Estado de sincronización
  createdAt: string;         // Fecha de creación (ISO)
  updatedAt?: string;        // Fecha de actualización (ISO)
}

// Datos para crear una compra
export interface CreatePurchaseData {
  date: string;
  productCode: string;
  quantity: number;
  comprobante?: string;
  supplier?: string;
  unitCost?: number;
  totalCost?: number;
  createdBy: string;
}

// Datos para actualizar una compra
export interface UpdatePurchaseData {
  date?: string;
  comprobante?: string;
  supplier?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
  updatedBy?: string;
}

// Estadísticas de compras
export interface PurchaseStatistics {
  totalPurchases: number;
  activePurchases: number;
  deletedPurchases: number;
  totalCostPurchased: number;
  averageCostPerPurchase: number;
}
