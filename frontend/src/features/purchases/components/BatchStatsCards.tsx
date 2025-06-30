import React from 'react';
import { Package, Box, Boxes, Clock } from 'lucide-react';
import { StatsCard } from './StatsCard';
import type { MedicationWithBatches } from '@/shared/types/Medication';
import { isBatchExpiringSoon } from '@/shared/services/BatchService';

interface BatchStatsCardsProps {
  medications: MedicationWithBatches[];
  totalMedications: number;
}

export const BatchStatsCards: React.FC<BatchStatsCardsProps> = ({ 
  medications, 
  totalMedications 
}) => {
  // Cálculos para las estadísticas
  const totalBatches = medications.reduce((total, med) => total + med.batchCount, 0);
  const totalStock = medications.reduce((total, med) => total + med.totalStock, 0);
  const expiringBatches = medications.reduce((count, med) => {
    return count + med.batches.filter(batch => 
      isBatchExpiringSoon(batch.expirationDate, 30)
    ).length;
  }, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        title="Total Medicamentos"
        value={totalMedications}
        icon={Boxes}
        color="blue"
      />

      <StatsCard 
        title="Total Lotes"
        value={totalBatches}
        icon={Box}
        color="green"
      />

      <StatsCard 
        title="Stock Total"
        value={totalStock}
        icon={Package}
        color="purple"
      />

      <StatsCard 
        title="Próximos a Vencer"
        value={expiringBatches}
        icon={Clock}
        color="orange"
      />
    </div>
  );
};

export default BatchStatsCards;
