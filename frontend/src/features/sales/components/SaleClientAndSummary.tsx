import { memo, useCallback } from "react";
import ClientSection from "./ClientSection";
import MedicSection from "./MedicSection";
import PaymentMethodSelector from "./PaymentMethodSelector";
import SaleSummary from "./SaleSummary";
import type { SaleState } from '../types/sale.types';
import type { Client } from '@/shared/types/Client';
import type { Medic } from '@/shared/types/Sales';

interface SaleClientAndSummaryProps {
  saleState: SaleState;
  onClientSelect: (client: Client | null) => void;
  onMedicSelect: (medic: Medic | null) => void;
  onClientDiscountChange: (type: 'percentage' | 'fixed', value: number) => void;
  onPaymentMethodChange: (method: 'efectivo' | 'qr' | 'transferencia') => void;
  onConfirmSale: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const SaleClientAndSummary = memo(({
  saleState,
  onClientSelect,
  onMedicSelect,
  onClientDiscountChange,
  onPaymentMethodChange,
  onConfirmSale,
  onCancel,
  isProcessing = false
}: SaleClientAndSummaryProps) => {

  // Manejar selección de cliente
  const handleClientSelect = useCallback((client: Client | null) => {
    onClientSelect(client);
  }, [onClientSelect]);

  // Manejar selección de médico
  const handleMedicSelect = useCallback((medic: Medic | null) => {
    onMedicSelect(medic);
  }, [onMedicSelect]);

  // Manejar cambio de método de pago
  const handlePaymentMethodChange = useCallback((method: 'efectivo' | 'qr' | 'transferencia') => {
    onPaymentMethodChange(method);
  }, [onPaymentMethodChange]);

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

      {/* Selector de método de pago */}
      <PaymentMethodSelector
        selectedMethod={saleState.paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        disabled={isProcessing}
      />

      {/* Resumen de venta */}
      <SaleSummary
        saleState={saleState}
        onClientDiscountChange={onClientDiscountChange}
        onConfirmSale={onConfirmSale}
        onCancel={onCancel}
        isProcessing={isProcessing}
      />
    </div>
  );
});

SaleClientAndSummary.displayName = 'SaleClientAndSummary';

export default SaleClientAndSummary;
