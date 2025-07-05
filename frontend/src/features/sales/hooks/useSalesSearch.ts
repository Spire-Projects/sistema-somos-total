import { useState, useEffect, useCallback } from 'react';
import { findSalesPaginated, findSalesByDateRangePaginated } from '@/shared/services/SalesService';
import type { Sale } from '@/shared/types/Sales';
import type { ItemsResponse } from '@/shared/types/UtilTypes';

interface SalesSearchState {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface SalesFilters {
  searchQuery: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useSalesSearch = (debounceMs: number = 300) => {
  const [state, setState] = useState<SalesSearchState>({
    sales: [],
    isLoading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 10,
    },
  });

  const [filters, setFilters] = useState<SalesFilters>({
    searchQuery: '',
  });

  const [debouncedFilters, setDebouncedFilters] = useState<SalesFilters>(filters);

  // Debounce para los filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, debounceMs]);

  // Función para buscar ventas
  const searchSales = useCallback(async (
    page: number,
    size: number,
    searchFilters: SalesFilters
  ): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let response: ItemsResponse<Sale>;

      if (searchFilters.dateFrom && searchFilters.dateTo) {
        // Ajustar fechas a 00:00 y 23:59
        const dateFrom = `${searchFilters.dateFrom}T00:00:00.000Z`;
        const dateTo = `${searchFilters.dateTo}T23:59:59.999Z`;
        
        response = await findSalesByDateRangePaginated(
          page,
          size,
          dateFrom,
          dateTo,
          searchFilters.searchQuery.trim() || undefined
        );
      } else {
        response = await findSalesPaginated(
          page,
          size,
          searchFilters.searchQuery.trim() || undefined
        );
      }

      setState(prev => ({
        ...prev,
        sales: response.items,
        isLoading: false,
        pagination: {
          currentPage: response.page,
          totalPages: response.totalPages,
          totalItems: response.totalItems,
          itemsPerPage: response.size,
        },
      }));
    } catch (error) {
      console.error('Error searching sales:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar ventas',
      }));
    }
  }, []);

  // Buscar cuando cambien los filtros con debounce
  useEffect(() => {
    searchSales(1, state.pagination.itemsPerPage, debouncedFilters);
  }, [debouncedFilters, searchSales, state.pagination.itemsPerPage]);

  // Funciones para actualizar filtros
  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setDateRange = useCallback((dateFrom?: string, dateTo?: string) => {
    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      dateFrom: undefined,
      dateTo: undefined,
    });
  }, []);

  // Cambiar página
  const changePage = useCallback((page: number) => {
    searchSales(page, state.pagination.itemsPerPage, debouncedFilters);
  }, [searchSales, state.pagination.itemsPerPage, debouncedFilters]);

  // Cambiar items por página
  const changeItemsPerPage = useCallback((itemsPerPage: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, itemsPerPage }
    }));
    searchSales(1, itemsPerPage, debouncedFilters);
  }, [searchSales, debouncedFilters]);

  return {
    // Estado
    sales: state.sales,
    isLoading: state.isLoading,
    error: state.error,
    pagination: state.pagination,
    
    // Filtros actuales
    filters,
    
    // Acciones
    setSearchQuery,
    setDateRange,
    clearFilters,
    changePage,
    changeItemsPerPage,
    refetch: () => searchSales(state.pagination.currentPage, state.pagination.itemsPerPage, debouncedFilters),
  };
};
