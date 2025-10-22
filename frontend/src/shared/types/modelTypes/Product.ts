import type { IEntity } from "../UtilTypes";

/**
 * Modelo principal de Producto
 * Extends IEntity para incluir timestamps, auditoria, y estado de sincronización
 */
export interface Product extends IEntity {
  code: string;              // Código único de producto (PK)
  name: string;              // Nombre del producto
  category?: string;         // Id de Categoría del producto
  description?: string;      // Descripción detallada
}

/**
 * CRUD interfaces
 */

export interface CreateProductData {
  code: string;
  name: string;
  category?: string;
  description?: string;
  createdBy: string;
}

export interface UpdateProductData {
  name?: string;
  category?: string;
  description?: string;
  updatedBy?: string;
}

/**
 * View interfaces
 */
export interface ProductView extends Product {
  categoryName?: string;     // Nombre de la categoría
  stock?    : number;          // Stock disponible 
}

/**
 * FFilter interfaces
 */

export interface ProductFilter {
    category?: string;         // Filtrar por categoría
}
