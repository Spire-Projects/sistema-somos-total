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

  // Agregar medicamento a la venta
  const addMedicationToSale = useCallback((medication: MedicationCatalogView) => {
    // Buscar si ya existe el medicamento en la venta
    const existingItemIndex = saleState.items.findIndex(
      item => item.medication.id === medication.id
    );

    // Obtener precio del lote más próximo a vencer
    const unitPrice = medication.activeBatches?.[0]?.sellingPrice || 0;

    if (existingItemIndex >= 0) {
      // Si ya existe, incrementar cantidad
      const updatedItems = [...saleState.items];
      const existingItem = updatedItems[existingItemIndex];
      existingItem.quantity += 1;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      
      setSaleState(prev => ({
        ...prev,
        items: updatedItems,
        ...calculateTotals(updatedItems)
      }));
    } else {
      // Si no existe, crear nuevo item
      const newItem: SaleItem = {
        id: generateId(),
        medication,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
        batchId: medication.oldestActiveBatch?.id,
        addedAt: new Date().toISOString()
      };

      const updatedItems = [...saleState.items, newItem];
      setSaleState(prev => ({
        ...prev,
        items: updatedItems,
        ...calculateTotals(updatedItems)
      }));
    }
  }, [saleState.items]);

  // Actualizar cantidad de un item
  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = saleState.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice
        };
      }
      return item;
    });

    setSaleState(prev => ({
      ...prev,
      items: updatedItems,
      ...calculateTotals(updatedItems)
    }));
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
