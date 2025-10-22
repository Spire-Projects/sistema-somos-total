export interface Sale {
  id: string;                // UUID
  date: string;              // Fecha (ISO)
  comprobante?: string;      // Nro de comprobante o factura
  productCode: string;       // Referencia a Product.code
  client?: string;           // Cliente
  quantity: number;          // Cantidad vendida
  unitPrice?: number;        // Precio unitario
  totalPrice?: number;       // Total venta
  createdBy: string;         // Usuario que creó el registro
  updatedBy?: string;        // Último usuario que lo modificó
  isDeleted: boolean;        // Borrado lógico
  sincronized: boolean;      // Estado de sincronización
  createdAt: string;         // Fecha de creación (ISO)
  updatedAt?: string;        // Fecha de actualización (ISO)
}

// Datos para crear una venta
export interface CreateSaleData {
  date: string;
  productCode: string;
  quantity: number;
  comprobante?: string;
  client?: string;
  unitPrice?: number;
  totalPrice?: number;
  createdBy: string;
}

// Datos para actualizar una venta
export interface UpdateSaleData {
  date?: string;
  comprobante?: string;
  client?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  updatedBy?: string;
}

// Estadísticas de ventas
export interface SalesStatistics {
  totalSales: number;
  activeSales: number;
  deletedSales: number;
  totalRevenueGenerated: number;
  averageRevenuePerSale: number;
  topProductsById: string[];
}
