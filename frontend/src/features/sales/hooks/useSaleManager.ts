import { useState, useCallback } from 'react';
import { generateId } from '@/shared/utils/id.utils';
import type { SaleItem, SaleState } from '../types/sale.types';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

export const useSaleManager = () => {
  const [saleState, setSaleState] = useState<SaleState>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  });

  // Agregar medicamento a la venta con lógica FIFO automática
  const addMedicationToSale = useCallback((medication: MedicationCatalogView, requestedQuantity: number = 1) => {
    if (!medication.activeBatches || medication.activeBatches.length === 0) {
      console.warn('No hay lotes activos disponibles para este medicamento');
      return;
    }

    // Ordenar lotes por fecha de vencimiento (FIFO - First In, First Out)
    const sortedBatches = [...medication.activeBatches].sort(
      (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
    );

    const newItems: SaleItem[] = [];
    let remainingQuantity = requestedQuantity;

    // Procesar cada lote en orden FIFO
    for (const batch of sortedBatches) {
      if (remainingQuantity <= 0) break;

      // Verificar si ya existe un item para este lote específico
      const existingItemIndex = saleState.items.findIndex(
        item => item.medication.id === medication.id && item.batchId === batch.id
      );

      const quantityFromThisBatch = Math.min(remainingQuantity, batch.quantity);

      if (existingItemIndex >= 0) {
        // Actualizar item existente
        const updatedItems = [...saleState.items];
        const existingItem = updatedItems[existingItemIndex];
        
        // Verificar que no exceda el stock del lote
        const maxAdditional = batch.quantity - existingItem.quantity;
        const actualQuantityToAdd = Math.min(quantityFromThisBatch, maxAdditional);
        
        if (actualQuantityToAdd > 0) {
          existingItem.quantity += actualQuantityToAdd;
          existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
          remainingQuantity -= actualQuantityToAdd;
        }
        
        setSaleState(prev => ({
          ...prev,
          items: updatedItems,
          ...calculateTotals(updatedItems)
        }));
      } else {
        // Crear nuevo item para este lote
        const newItem: SaleItem = {
          id: generateId(),
          medication,
          quantity: quantityFromThisBatch,
          unitPrice: batch.sellingPrice,
          totalPrice: quantityFromThisBatch * batch.sellingPrice,
          batchId: batch.id,
          batchInfo: {
            batchId: batch.batchId,
            expirationDate: batch.expirationDate,
            availableStock: batch.quantity,
            daysToExpiration: batch.daysToExpiration
          },
          addedAt: new Date().toISOString()
        };

        newItems.push(newItem);
        remainingQuantity -= quantityFromThisBatch;
      }
    }

    // Agregar todos los nuevos items
    if (newItems.length > 0) {
      const updatedItems = [...saleState.items, ...newItems];
      setSaleState(prev => ({
        ...prev,
        items: updatedItems,
        ...calculateTotals(updatedItems)
      }));
    }

    // Advertir si no se pudo satisfacer toda la cantidad solicitada
    if (remainingQuantity > 0) {
      console.warn(`Solo se pudieron agregar ${requestedQuantity - remainingQuantity} de ${requestedQuantity} unidades solicitadas debido a stock limitado`);
    }
  }, [saleState.items]);

  // Actualizar cantidad de un item (con validación de stock por lote)
  const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const itemToUpdate = saleState.items.find(item => item.id === itemId);
    if (!itemToUpdate) return;

    // Validar que no exceda el stock disponible del lote específico
    const maxAllowed = itemToUpdate.batchInfo.availableStock;
    const finalQuantity = Math.min(newQuantity, maxAllowed);

    const updatedItems = saleState.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: finalQuantity,
          totalPrice: finalQuantity * item.unitPrice
        };
      }
      return item;
    });

    setSaleState(prev => ({
      ...prev,
      items: updatedItems,
      ...calculateTotals(updatedItems)
    }));

    // Advertir si se limitó la cantidad por stock
    if (finalQuantity < newQuantity) {
      console.warn(`Cantidad limitada a ${finalQuantity} debido al stock disponible del lote ${itemToUpdate.batchInfo.batchId}`);
    }
  }, [saleState.items]);

  // Remover item de la venta
  const removeItem = useCallback((itemId: string) => {
    const updatedItems = saleState.items.filter(item => item.id !== itemId);
    setSaleState(prev => ({
      ...prev,
      items: updatedItems,
      ...calculateTotals(updatedItems)
    }));
  }, [saleState.items]);

  // Limpiar venta
  const clearSale = useCallback(() => {
    setSaleState({
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    });
  }, []);

  // Establecer cliente
  const setClient = useCallback((clientId?: string, clientName?: string) => {
    setSaleState(prev => ({
      ...prev,
      clientId,
      clientName
    }));
  }, []);

  return {
    saleState,
    addMedicationToSale,
    updateItemQuantity,
    removeItem,
    clearSale,
    setClient
  };
};

// Helper para calcular totales
const calculateTotals = (items: SaleItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.13; // 13% IVA (ajustar según legislación)
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total
  };
};
