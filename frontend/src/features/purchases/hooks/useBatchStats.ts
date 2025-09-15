import { useState, useEffect } from 'react';
import { getMedicationBatchRepository } from '@/shared/db/repositories/medicationBatch.repository';
import { config } from '@/shared/config/config';

export interface BatchStatsData {
  totalMedications: number;
  totalBatches: number;
  totalStock: number;
  expiringBatches: number;
}

export interface UseBatchStatsReturn {
  stats: BatchStatsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook personalizado para cargar estadísticas de lotes de manera asíncrona
 * @param medications - Array de medicamentos para calcular estadísticas locales
 * @param totalMedications - Total de medicamentos en el sistema
 */
export const useBatchStats = (
  medications: any[],
  totalMedications: number
): UseBatchStatsReturn => {
  const [stats, setStats] = useState<BatchStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Obtener repositorio
      const batchRepository = getMedicationBatchRepository();

      // Calcular stock total de los medicamentos en memoria (mantenemos esto local)
      const totalStock = medications.reduce((total, med) => total + med.totalStock, 0);

      // 🆕 Obtener total de lotes desde la BD completa
      const [totalActiveBatches, expiringStats] = await Promise.all([
        batchRepository.getTotalActiveBatchesCount(),
        batchRepository.getExpiringAndExpiredBatchesCount(config.INVENTORY.EXPIRING_SOON_DAYS)
      ]);

      const statsData: BatchStatsData = {
        totalMedications,
        totalBatches: totalActiveBatches, // 🆕 Ahora viene de la BD completa
        totalStock,
        expiringBatches: expiringStats.total, // Incluye vencidos + próximos a vencer
      };

      setStats(statsData);
    } catch (err) {
      console.error('Error loading batch stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Fallback: usar cálculos en memoria si falla la consulta a BD
      const fallbackStats: BatchStatsData = {
        totalMedications,
        totalBatches: medications.reduce((total, med) => total + med.batchCount, 0), // Fallback local
        totalStock: medications.reduce((total, med) => total + med.totalStock, 0),
        expiringBatches: 0, // No podemos calcular esto sin acceso a BD
      };
      setStats(fallbackStats);
    } finally {
      setLoading(false);
    }
  };

  // Cargar stats al montar el hook o cuando cambien las dependencias
  useEffect(() => {
    loadStats();
  }, [medications, totalMedications]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats,
  };
};