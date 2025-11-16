import { productService } from '@/shared/services/ProductService';
import { purchaseService } from '@/shared/services/PurchaseService';
import type { ParsedPurchaseRow } from '../types/ParsedPurchaseRow';
import type { Product } from '@/shared/types/modelTypes/Product';

/**
 * Resultado de la importación de una fila
 */
export interface ImportRowResult {
  row: ParsedPurchaseRow;
  success: boolean;
  productId?: string;
  purchaseId?: string;
  error?: string;
}

/**
 * Resultado completo de la importación
 */
export interface ImportResult {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  results: ImportRowResult[];
}

/**
 * Genera un número de recibo único
 * Formato: 4 letras + 4 números (ej: ABCD1234)
 */
function generateReceiptNumber(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let receipt = '';
  
  // 4 letras aleatorias
  for (let i = 0; i < 4; i++) {
    receipt += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 4 números aleatorios
  for (let i = 0; i < 4; i++) {
    receipt += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return receipt;
}

/**
 * Busca un producto por código, si no existe lo crea
 */
async function findOrCreateProduct(
  codigo: string,
  descripcion: string
): Promise<Product> {
  try {
    // Buscar productos existentes
    const response = await productService.getAllView(1, 1000);
    const existingProduct = response.items.find(
      (p) => p.code.toUpperCase() === codigo.toUpperCase()
    );
    
    if (existingProduct) {
      return existingProduct;
    }
    
    // Crear nuevo producto
    const newProduct = await productService.create({
      code: codigo,
      name: descripcion,
      createdBy: 'excel-importer',
    });
    
    return newProduct;
  } catch (error) {
    console.error('Error finding or creating product:', error);
    throw error;
  }
}

/**
 * Importa una fila del Excel como compra
 */
async function importRow(
  row: ParsedPurchaseRow,
  createdBy: string
): Promise<ImportRowResult> {
  try {
    // 1. Encontrar o crear el producto
    const product = await findOrCreateProduct(row.codigo, row.descripcion);
    
    // 2. Validar que tengamos al menos precio unitario y cantidad
    const unitCost = row.pu ?? 0;
    const quantity = row.pzas ?? 1;
    
    if (unitCost <= 0 && quantity <= 0) {
      return {
        row,
        success: false,
        error: 'Precio unitario y cantidad inválidos',
      };
    }
    
    // 3. Crear la compra
    const purchase = await purchaseService.create({
      productId: product.id,
      purchaseDate: new Date().toISOString(),
      receiptNumber: generateReceiptNumber(),
      quantityPurchased: quantity,
      unitCost: unitCost,
      totalCost: quantity * unitCost,
      profitMarginPercentage: 0,
      notes: row.descripcion,
      createdBy,
    });
    
    return {
      row,
      success: true,
      productId: product.id,
      purchaseId: purchase.id,
    };
  } catch (error) {
    console.error('Error importing row:', error);
    return {
      row,
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Servicio para importar compras desde Excel
 */
class PurchaseImporterService {
  /**
   * Importa múltiples filas del Excel como compras
   * Procesa de manera secuencial para evitar problemas de concurrencia
   */
  async importRows(
    rows: ParsedPurchaseRow[],
    createdBy: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<ImportResult> {
    const results: ImportRowResult[] = [];
    let successfulImports = 0;
    let failedImports = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Notificar progreso
      if (onProgress) {
        onProgress(i + 1, rows.length);
      }
      
      // Importar fila
      const result = await importRow(row, createdBy);
      results.push(result);
      
      if (result.success) {
        successfulImports++;
      } else {
        failedImports++;
      }
    }
    
    return {
      totalRows: rows.length,
      successfulImports,
      failedImports,
      results,
    };
  }
}

export const purchaseImporterService = new PurchaseImporterService();
