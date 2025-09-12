import { useState, useEffect, useCallback, useRef } from 'react';
import { searchMedicationCatalogPaginated } from '@/shared/services/MedicationService';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

interface UseMedicationSearchResult {
  medications: MedicationCatalogView[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

export const useMedicationSearch = (debounceMs: number = 300): UseMedicationSearchResult => {
  const [medications, setMedications] = useState<MedicationCatalogView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce effect para el query
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, debounceMs]);

  // Función de búsqueda
  const performSearch = useCallback(async (query: string) => {
    // Cancelar búsqueda anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Limpiar resultados si query está vacío
    if (!query.trim()) {
      setMedications([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();

    try {
      const result = await searchMedicationCatalogPaginated(
        query.trim(),
        1, // primera página
        50 // 10 resultados
        // Sin filtro hasStock para mostrar todos los medicamentos
      );

      // Solo mostrar logs en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Búsqueda de medicamentos:', { query: query.trim(), resultados: result.items.length });
      }

      // Verificar si la búsqueda no fue cancelada
      if (!abortControllerRef.current?.signal.aborted) {
        setMedications(result.items);
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Error en la búsqueda');
        setMedications([]);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Effect para ejecutar búsqueda cuando cambie debouncedQuery
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setMedications([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    medications,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    clearSearch
  };
};
