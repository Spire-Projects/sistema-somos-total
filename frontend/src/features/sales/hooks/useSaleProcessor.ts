import { useState, useCallback } from 'react';
import { saleProcessorService } from '../services/SaleProcessorService';
import type { SaleState } from '../types/sale.types';
import type { Sale } from '@/shared/types/Sales';

interface UseSaleProcessorState {
  isProcessing: boolean;
  error: string | null;
  lastSale: Sale | null;
}

interface SaleProcessorResult {
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

export const useSaleProcessor = () => {
  const [state, setState] = useState<UseSaleProcessorState>({
    isProcessing: false,
    error: null,
    lastSale: null,
  });

  const processSale = useCallback(async (
    saleState: SaleState,
    userId: string = 'current-user' // TODO: Obtener del contexto de auth
  ): Promise<SaleProcessorResult> => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null
    }));

    try {
      const result = await saleProcessorService.processSale(saleState, userId);
      
      if (result.success && result.sale) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          lastSale: result.sale!,
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: result.error || 'Error desconocido'
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const clearLastSale = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastSale: null
    }));
  }, []);

  return {
    // Estado
    isProcessing: state.isProcessing,
    error: state.error,
    lastSale: state.lastSale,
    
    // Acciones
    processSale,
    clearError,
    clearLastSale
  };
};
