import { useState, useCallback } from 'react';
import { generateId } from '@/shared/utils/id.utils';
import type { SaleItem, SaleState } from '../types/sale.types';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

export const useSaleManager = () => {
  const [saleState, setSaleState] = useState<SaleState>({
    items: [],
    subtotal: 0,
    amountWithDiscount: 0,
    amountWithoutDiscount: 0,
    totalSaved: 0,
    total: 0,
    paymentMethod: 'efectivo'
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
          existingItem.total = existingItem.quantity * existingItem.unitPrice;
          remainingQuantity -= actualQuantityToAdd;
        }
        
        setSaleState(prev => ({
          ...prev,
          items: updatedItems,
          ...calculateTotals(updatedItems, prev.clientDiscount)
        }));
      } else {
        // Crear nuevo item para este lote
        const newItem: SaleItem = {
          id: generateId(),
          medication,
          medicationId: medication.id,
          quantity: quantityFromThisBatch,
          listPrice: batch.sellingPrice, // Precio original
          discount: 0, // Sin descuento inicial
          unitPrice: batch.sellingPrice, // Precio final (igual al precio lista sin descuento)
          total: quantityFromThisBatch * batch.sellingPrice,
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
        ...calculateTotals(updatedItems, prev.clientDiscount)
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
          total: finalQuantity * item.unitPrice
        };
      }
      return item;
    });

    setSaleState(prev => ({
      ...prev,
      items: updatedItems,
      ...calculateTotals(updatedItems, prev.clientDiscount)
    }));

    // Advertir si se limitó la cantidad por stock
    if (finalQuantity < newQuantity) {
      console.warn(`Cantidad limitada a ${finalQuantity} debido al stock disponible del lote ${itemToUpdate.batchInfo.batchId}`);
    }
  }, [saleState.items]);

  // Actualizar descuento de un item
  const updateItemDiscount = useCallback((itemId: string, newDiscount: number) => {
    const itemToUpdate = saleState.items.find(item => item.id === itemId);
    if (!itemToUpdate) return;

    // Calcular precio lista si no existe
    const listPrice = itemToUpdate.listPrice || (itemToUpdate.unitPrice + (itemToUpdate.discount || 0));
    
    // Validar que el descuento no sea mayor al precio lista
    const maxDiscount = listPrice;
    const finalDiscount = Math.min(Math.max(newDiscount, 0), maxDiscount);
    
    // Calcular nuevo precio unitario
    const newUnitPrice = listPrice - finalDiscount;

    const updatedItems = saleState.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          listPrice,
          discount: finalDiscount,
          unitPrice: newUnitPrice,
          total: item.quantity * newUnitPrice
        };
      }
      return item;
    });

    setSaleState(prev => ({
      ...prev,
      items: updatedItems,
      ...calculateTotals(updatedItems, prev.clientDiscount)
    }));
  }, [saleState.items]);

  // Remover item de la venta
  const removeItem = useCallback((itemId: string) => {
    const updatedItems = saleState.items.filter(item => item.id !== itemId);
    setSaleState(prev => ({
      ...prev,
      items: updatedItems,
      ...calculateTotals(updatedItems, prev.clientDiscount)
    }));
  }, [saleState.items]);

  // Limpiar venta
  const clearSale = useCallback(() => {
    setSaleState({
      items: [],
      subtotal: 0,
      amountWithDiscount: 0,
      amountWithoutDiscount: 0,
      totalSaved: 0,
      total: 0,
      paymentMethod: 'efectivo'
    });
  }, []);

  // Establecer descuento de cliente
  const setClientDiscount = useCallback((type: 'percentage' | 'fixed', value: number) => {
    setSaleState(prev => {
      const newState = { ...prev };
      
      if (value > 0) {
        const subtotalForDiscount = prev.subtotal;
        let discountAmount = 0;
        
        if (type === 'percentage') {
          discountAmount = (subtotalForDiscount * value) / 100;
        } else {
          discountAmount = Math.min(value, subtotalForDiscount); // No puede ser mayor al subtotal
        }
        
        newState.clientDiscount = {
          type,
          value,
          amount: discountAmount
        };
      } else {
        newState.clientDiscount = undefined;
      }
      
      return {
        ...newState,
        ...calculateTotals(prev.items, newState.clientDiscount)
      };
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

  // Establecer médico
  const setMedic = useCallback((medicId?: string, medicName?: string) => {
    setSaleState(prev => ({
      ...prev,
      medicId,
      medicName
    }));
  }, []);

  // Establecer método de pago
  const setPaymentMethod = useCallback((paymentMethod: 'efectivo' | 'qr' ) => {
    setSaleState(prev => ({
      ...prev,
      paymentMethod
    }));
  }, []);

  // Establecer NIT del cliente
  const setNitClient = useCallback((nitClient?: string, socialReasonClient?: string) => {
    setSaleState(prev => ({
      ...prev,
      nitClient,
      socialReasonClient
    }));
  }, []);

  // Establecer notas de venta
  const setSaleNotes = useCallback((saleNotes: string) => {
    setSaleState(prev => ({
      ...prev,
      saleNotes
    }));
  }, []);

  return {
    saleState,
    addMedicationToSale,
    updateItemQuantity,
    updateItemDiscount,
    setClientDiscount,
    removeItem,
    clearSale,
    setClient,
    setMedic,
    setPaymentMethod,
    setNitClient,
    setSaleNotes
  };
};

// Helper para calcular totales
const calculateTotals = (items: SaleItem[], clientDiscount?: SaleState['clientDiscount']) => {
  // MONTO SIN DESC: Precio original total (suma de listPrice * quantity)
  const amountWithoutDiscount = items.reduce((sum, item) => {
    const listPrice = item.listPrice || item.unitPrice + (item.discount || 0);
    return sum + (listPrice * item.quantity);
  }, 0);
  
  // SUBTOTAL: Con descuentos por unidad aplicados (suma de precios finales)
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  
  // Calcular descuento de cliente
  const clientDiscountAmount = clientDiscount?.amount || 0;
  
  // MONTO CON DESC: Con descuento del cliente aplicado
  const amountWithDiscount = subtotal - clientDiscountAmount;
  
  // Calcular total de descuentos por producto
  const totalProductDiscounts = items.reduce((sum, item) => {
    if (item.discount && item.listPrice) {
      return sum + (item.discount * item.quantity);
    }
    return sum;
  }, 0);
  
  // Total ahorrado = descuentos por producto + descuento de cliente
  const totalSaved = totalProductDiscounts + clientDiscountAmount;
  
  // TOTAL POR COBRAR = MONTO CON DESC
  const total = amountWithDiscount;

  return {
    subtotal,
    amountWithDiscount,
    amountWithoutDiscount,
    totalSaved,
    total
  };
};
