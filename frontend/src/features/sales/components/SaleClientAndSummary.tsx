import { memo, useCallback } from "react";
import ClientSection from "./ClientSection";
import MedicSection from "./MedicSection";
import SaleSummary from "./SaleSummary";
import type { SaleState } from '../types/sale.types';
import type { Client } from '@/shared/types/Client';
import type { Medic } from '@/shared/types/Sales';

interface SaleClientAndSummaryProps {
  saleState: SaleState;
  onClientSelect: (client: Client | null) => void;
  onMedicSelect: (medic: Medic | null) => void;
  onClientDiscountChange: (type: 'percentage' | 'fixed', value: number) => void;
  onConfirmSale: () => void;
  onCancel: () => void;
}

const SaleClientAndSummary = memo(({
  saleState,
  onClientSelect,
  onMedicSelect,
  onClientDiscountChange,
  onConfirmSale,
  onCancel
}: SaleClientAndSummaryProps) => {

  // Manejar selección de cliente
  const handleClientSelect = useCallback((client: Client | null) => {
    onClientSelect(client);
  }, [onClientSelect]);

  // Manejar selección de médico
  const handleMedicSelect = useCallback((medic: Medic | null) => {
    onMedicSelect(medic);
  }, [onMedicSelect]);

  return (
    <div className="lg:w-80 flex flex-col gap-4 max-h-[calc(100vh-200px)] overflow-y-auto px-2">
      {/* Sección de cliente */}
      <ClientSection
        selectedClientId={saleState.clientId}
        selectedClientName={saleState.clientName}
        onClientSelect={handleClientSelect}
      />

      {/* Sección de médico */}
      <MedicSection
        selectedMedicId={saleState.medicId}
        selectedMedicName={saleState.medicName}
        onMedicSelect={handleMedicSelect}
      />

      {/* Resumen de venta */}
      <SaleSummary
        saleState={saleState}
        onClientDiscountChange={onClientDiscountChange}
        onConfirmSale={onConfirmSale}
        onCancel={onCancel}
      />
    </div>
  );
});

SaleClientAndSummary.displayName = 'SaleClientAndSummary';

export default SaleClientAndSummary;
