import { purchaseService } from '@/shared/services/PurchaseService';
import type { SaleView, SaleItemView } from '@/shared/types/modelTypes/Sale';
import type { PurchaseView } from '@/shared/types/modelTypes/PurchaseBox';

/**
 * Representa un producto con problemas de stock
 */
export interface StockIssue {
  item: SaleItemView;
  issue: 'out_of_stock' | 'insufficient_stock' | 'price_changed';
  currentStock: number;
  requestedQuantity: number;
  alternativePurchaseBox?: {
    purchaseBox: PurchaseView;
    availableStock: number;
    unitPrice: number;
  };
}

/**
 * Resultado de la verificación de stock
 */
export interface StockVerificationResult {
  hasIssues: boolean;
  issues: StockIssue[];
  validItems: SaleItemView[];
}

/**
 * Servicio para verificar stock de cotizaciones
 */
class QuotationStockVerificationService {
  /**
   * Verifica el stock de todos los items de una cotización
   */
  async verifyQuotationStock(quotation: SaleView): Promise<StockVerificationResult> {
    const issues: StockIssue[] = [];
    const validItems: SaleItemView[] = [];

    for (const item of quotation.items) {
      const issue = await this.verifyItemStock(item);
      
      if (issue) {
        issues.push(issue);
      } else {
        validItems.push(item);
      }
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      validItems,
    };
  }

  /**
   * Verifica el stock de un item individual
   */
  private async verifyItemStock(item: SaleItemView): Promise<StockIssue | null> {
    try {
      // Obtener el purchaseBox original
      const purchaseBox = await purchaseService.findById(item.purchaseBoxId);

      if (!purchaseBox) {
        return {
          item,
          issue: 'out_of_stock',
          currentStock: 0,
          requestedQuantity: item.quantity,
        };
      }

      // Verificar stock disponible
      if (purchaseBox.quantityAvailable === 0) {
        // Buscar alternativa
        const alternative = await this.findAlternativePurchaseBox(
          item.product,
          item.quantity
        );

        return {
          item,
          issue: 'out_of_stock',
          currentStock: 0,
          requestedQuantity: item.quantity,
          alternativePurchaseBox: alternative,
        };
      }

      // Verificar stock insuficiente
      if (purchaseBox.quantityAvailable < item.quantity) {
        // Buscar alternativa
        const alternative = await this.findAlternativePurchaseBox(
          item.product,
          item.quantity
        );

        return {
          item,
          issue: 'insufficient_stock',
          currentStock: purchaseBox.quantityAvailable,
          requestedQuantity: item.quantity,
          alternativePurchaseBox: alternative,
        };
      }

      // Verificar cambio de precio
      const currentPrice = this.calculateSellingPrice(
        purchaseBox.unitCost,
        purchaseBox.profitMarginPercentage || 0
      );

      if (Math.abs(currentPrice - item.unitPrice) > 0.01) {
        return {
          item,
          issue: 'price_changed',
          currentStock: purchaseBox.quantityAvailable,
          requestedQuantity: item.quantity,
        };
      }

      return null;
    } catch (error) {
      console.error('Error verificando stock del item:', error);
      return {
        item,
        issue: 'out_of_stock',
        currentStock: 0,
        requestedQuantity: item.quantity,
      };
    }
  }

  /**
   * Busca un purchaseBox alternativo con stock disponible
   */
  private async findAlternativePurchaseBox(
    productId: string,
    requiredQuantity: number
  ): Promise<StockIssue['alternativePurchaseBox']> {
    try {
      // Obtener todos los purchaseBoxes del producto
      const allPurchases = await purchaseService.getAllView(1, 1000, '', undefined, undefined, {
        productId,
      });

      // Filtrar solo los que tienen stock suficiente
      const validPurchases = allPurchases.items.filter(
        (p: PurchaseView) => p.quantityAvailable >= requiredQuantity
      );

      if (validPurchases.length === 0) {
        return undefined;
      }

      // Ordenar por fecha de compra (más reciente primero)
      validPurchases.sort((a: PurchaseView, b: PurchaseView) => {
        const dateA = new Date(a.purchaseDate).getTime();
        const dateB = new Date(b.purchaseDate).getTime();
        return dateB - dateA;
      });

      const alternative = validPurchases[0];
      const sellingPrice = this.calculateSellingPrice(
        alternative.unitCost,
        alternative.profitMarginPercentage || 0
      );

      return {
        purchaseBox: alternative,
        availableStock: alternative.quantityAvailable,
        unitPrice: sellingPrice,
      };
    } catch (error) {
      console.error('Error buscando purchaseBox alternativo:', error);
      return undefined;
    }
  }

  /**
   * Calcula el precio de venta basado en costo y margen
   */
  private calculateSellingPrice(unitCost: number, profitMargin: number): number {
    return unitCost * (1 + profitMargin / 100);
  }
}

export const quotationStockVerificationService =
  new QuotationStockVerificationService();
