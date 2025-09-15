import React from 'react';
import { Package, Box, Boxes, Clock } from 'lucide-react';
import { StatsCard } from './StatsCard';
import type { MedicationWithBatches } from '@/shared/types/Medication';
import { useBatchStats } from '../hooks/useBatchStats';

interface BatchStatsCardsProps {
  medications: MedicationWithBatches[];
  totalMedications: number;
}

export const BatchStatsCards: React.FC<BatchStatsCardsProps> = ({ 
  medications, 
  totalMedications 
}) => {
  const { stats, loading, error } = useBatchStats(medications, totalMedications);

  // Usar valores por defecto si no hay stats aún
  const displayStats = stats || {
    totalMedications: totalMedications,
    totalBatches: 0,
    totalStock: 0,
    expiringBatches: 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        title="Total Medicamentos"
        value={displayStats.totalMedications}
        icon={Boxes}
        color="blue"
        loading={loading}
      />

      <StatsCard 
        title="Total Lotes"
        value={displayStats.totalBatches}
        icon={Box}
        color="green"
        loading={loading}
      />

      <StatsCard 
        title="Stock Total"
        value={displayStats.totalStock}
        icon={Package}
        color="purple"
        loading={loading}
      />

      <StatsCard 
        title="Próximos a Vencer"
        value={displayStats.expiringBatches}
        icon={Clock}
        color="orange"
        loading={loading}
      />

      {error && (
        <div className="col-span-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">
              Error al cargar estadísticas: {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchStatsCards;
