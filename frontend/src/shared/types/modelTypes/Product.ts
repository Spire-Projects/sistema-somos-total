export interface Product {
  code: string;              // CÓDIGO
  name: string;              // PRODUCTO
  category?: string;         // CATEGORÍA
  stock?: number;            // Cantidad actual
  unitCost?: number;         // Costo unitario
  unitPrice?: number;        // Precio de venta unitario
  createdBy: string;         // Usuario que creó el registro
  updatedBy?: string;        // Último usuario que lo modificó
  isDeleted: boolean;        // Borrado lógico
  sincronized: boolean;      // Estado de sincronización
  createdAt: string;         // Fecha de creación (ISO)
  updatedAt?: string;        // Fecha de actualización (ISO)
}

// Datos para crear un producto
export interface CreateProductData {
  code: string;
  name: string;
  category?: string;
  stock?: number;
  unitCost?: number;
  unitPrice?: number;
  createdBy: string;
}

// Datos para actualizar un producto
export interface UpdateProductData {
  name?: string;
  category?: string;
  stock?: number;
  unitCost?: number;
  unitPrice?: number;
  updatedBy?: string;
}

// Estadísticas de productos
export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  deletedProducts: number;
  totalStock: number;
  lowStockProducts: number; // stock < 10
}
