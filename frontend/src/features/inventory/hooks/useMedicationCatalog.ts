import { useState, useMemo, useCallback } from 'react';
import type { 
  MedicationCatalogView, 
  MedicationCatalogFilters, 
  MedicationCatalogSort,
  MedicationCatalogQueryParams 
} from '@/shared/types/MedicationViewTypes';
import type { ItemsResponse } from '@/shared/types/UtilTypes';
import { 
  getMedicationCatalogPaginated, 
  searchMedicationCatalogPaginated 
} from '@/shared/services/MedicationService';

interface UseMedicationCatalogParams {
  initialPage?: number;
  initialPageSize?: number;
  initialFilters?: MedicationCatalogFilters;
  initialSort?: MedicationCatalogSort;
}

interface UseMedicationCatalogReturn {
  // Data
  data: ItemsResponse<MedicationCatalogView> | null;
  medications: MedicationCatalogView[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  
  // Search & Filters
  searchQuery: string;
  filters: MedicationCatalogFilters;
  sort: MedicationCatalogSort | undefined;
  
  // Actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (query: string) => void;
  setFilters: (filters: MedicationCatalogFilters) => void;
  setSort: (sort: MedicationCatalogSort | undefined) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT: MedicationCatalogSort = {
  field: 'tradeName',
  order: 'asc'
};

export const useMedicationCatalog = (
  params: UseMedicationCatalogParams = {}
): UseMedicationCatalogReturn => {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    initialFilters = {},
    initialSort = DEFAULT_SORT
  } = params;

  // State
  const [data, setData] = useState<ItemsResponse<MedicationCatalogView> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MedicationCatalogFilters>(initialFilters);
  const [sort, setSort] = useState<MedicationCatalogSort | undefined>(initialSort);

  // Memoized query params
  const queryParams: MedicationCatalogQueryParams = useMemo(() => ({
    page: currentPage,
    size: pageSize,
    filters: {
      ...filters,
      ...(searchQuery && { searchQuery })
    },
    sort
  }), [currentPage, pageSize, filters, searchQuery, sort]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response: ItemsResponse<MedicationCatalogView>;

      if (searchQuery.trim()) {
        // Use search endpoint if there's a search query
        response = await searchMedicationCatalogPaginated(
          searchQuery,
          currentPage,
          pageSize,
          filters
        );
      } else {
        // Use catalog endpoint for filtered/sorted results
        response = await getMedicationCatalogPaginated(queryParams);
      }

      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading medications');
      console.error('Error fetching medication catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [queryParams, searchQuery, currentPage, pageSize, filters]);

  // Auto-fetch when dependencies change
  useMemo(() => {
    void fetchData();
  }, [fetchData]);

  // Derived values
  const medications = useMemo(() => data?.items || [], [data?.items]);
  const totalItems = useMemo(() => data?.totalItems || 0, [data?.totalItems]);
  const totalPages = useMemo(() => data?.totalPages || 0, [data?.totalPages]);

  // Actions
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setPageSizeAndReset = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const setFiltersAndReset = useCallback((newFilters: MedicationCatalogFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const setSortAndReset = useCallback((newSort: MedicationCatalogSort | undefined) => {
    setSort(newSort);
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setSort(DEFAULT_SORT);
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    // Data
    data,
    medications,
    
    // Loading states
    loading,
    error,
    
    // Pagination
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    
    // Search & Filters
    searchQuery,
    filters,
    sort,
    
    // Actions
    setPage,
    setPageSize: setPageSizeAndReset,
    setSearch,
    setFilters: setFiltersAndReset,
    setSort: setSortAndReset,
    clearFilters,
    refresh
  };
};
