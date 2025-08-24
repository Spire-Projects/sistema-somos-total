import { getMedicationBatchRepository } from '@/shared/db/repositories/medicationBatch.repository';
import { createSale } from '@/shared/services/SalesService';
import type { Sale, SaleItem as SaleSaleItem } from '@/shared/types/Sales';
import type { SaleState } from '../types/sale.types';

interface SaleProcessResult {
  success: boolean;
  sale?: Sale;
  error?: string;
  failedItems?: Array<{
    batchId: string;
    medicationId: string;
    requestedQuantity: number;
    availableQuantity: number;
  }>;
}

/**
 * Servicio para procesar ventas y manejar stock
 */
export class SaleProcessorService {
  private batchRepository = getMedicationBatchRepository();

  /**
   * Procesar una venta completa: validar stock, descontar inventario y guardar venta
   */
  async processSale(saleState: SaleState, userId: string): Promise<SaleProcessResult> {
    try {
      // 1. Validar stock disponible para todos los items
      const stockValidation = await this.validateStock(saleState.items);
      if (!stockValidation.isValid) {
        return {
          success: false,
          error: 'Stock insuficiente para algunos items',
          failedItems: stockValidation.failedItems
        };
      }

      // 2. Descontar stock de todos los lotes
      await this.updateStock(saleState.items);

      // 3. Preparar datos de la venta
      const saleData = this.prepareSaleData(saleState, userId);

      // 4. Guardar la venta
      const savedSale = await createSale(saleData);

      return {
        success: true,
        sale: savedSale
      };

    } catch (error) {
      console.error('Error processing sale:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al procesar la venta'
      };
    }
  }

  /**
   * Validar que hay stock suficiente para todos los items
   */
  private async validateStock(items: SaleState['items']): Promise<{
    isValid: boolean;
    failedItems: Array<{
      batchId: string;
      medicationId: string;
      requestedQuantity: number;
      availableQuantity: number;
    }>;
  }> {
    const failedItems: Array<{
      batchId: string;
      medicationId: string;
      requestedQuantity: number;
      availableQuantity: number;
    }> = [];

    for (const item of items) {
      const batch = await this.batchRepository.findById(item.batchId);
      
      if (!batch) {
        failedItems.push({
          batchId: item.batchId,
          medicationId: item.medicationId,
          requestedQuantity: item.quantity,
          availableQuantity: 0
        });
        continue;
      }

      if (batch.quantity < item.quantity) {
        failedItems.push({
          batchId: item.batchId,
          medicationId: item.medicationId,
          requestedQuantity: item.quantity,
          availableQuantity: batch.quantity
        });
      }
    }

    return {
      isValid: failedItems.length === 0,
      failedItems
    };
  }

  /**
   * Actualizar stock de todos los lotes
   */
  private async updateStock(items: SaleState['items']): Promise<void> {
    for (const item of items) {
      const batch = await this.batchRepository.findById(item.batchId);
      
      if (!batch) {
        throw new Error(`Lote ${item.batchId} no encontrado`);
      }

      const newQuantity = batch.quantity - item.quantity;
      
      if (newQuantity < 0) {
        throw new Error(`Stock insuficiente en lote ${item.batchId}. Disponible: ${batch.quantity}, Requerido: ${item.quantity}`);
      }

      // Actualizar la cantidad del lote
      await this.batchRepository.update(batch.id, {
        quantity: newQuantity,
        updatedBy: 'sale-system' // TODO: Usar ID del usuario actual
      });
    }
  }

  /**
   * Preparar datos de la venta para guardar
   */
  private prepareSaleData(saleState: SaleState, userId: string): Omit<Sale, 'id' | 'createdAt'> {
    // Convertir items del estado a items de venta
    const saleItems: SaleSaleItem[] = saleState.items.map(item => ({
      batchId: item.batchId,
      medicationId: item.medicationId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      listPrice: item.listPrice,
      discount: item.discount,
      total: item.total
    }));

    return {
      items: saleItems,
      total: saleState.total,
      totalWithoutDiscount: saleState.amountWithoutDiscount,
      totalDiscount: saleState.clientDiscount ? this.calculateClientDiscountAmount(saleState) : 0,
      client: saleState.clientName || undefined,
      paymentMethod: saleState.paymentMethod,
      createdBy: userId,
      isDeleted: false,
      sincronized: false,
      idMedic: saleState.medicName || undefined,
      factured: false
    };
  }

  /**
   * Calcular el monto del descuento de cliente
   */
  private calculateClientDiscountAmount(saleState: SaleState): number {
    if (!saleState.clientDiscount) return 0;

    if (saleState.clientDiscount.type === 'percentage') {
      return (saleState.subtotal * saleState.clientDiscount.value) / 100;
    } else {
      return saleState.clientDiscount.value;
    }
  }
}

// Instancia singleton del servicio
export const saleProcessorService = new SaleProcessorService();
