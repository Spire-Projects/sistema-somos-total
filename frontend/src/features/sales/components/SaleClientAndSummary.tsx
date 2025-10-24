import { memo, useCallback } from "react";
import ClientSection from "./ClientSection";
import NitSection from "./NitSection";
import SaleNotes from "./SaleNotes";
import PaymentMethodSelector from "./PaymentMethodSelector";
import SaleSummary from "./SaleSummary";
import type { SaleState } from '@/shared/types/modelTypes/Sale';
import type { Client } from '@/shared/types/Client';
import type { NIT } from '@/shared/types/Nit';

interface SaleClientAndSummaryProps {
  saleState: SaleState;
  onClientSelect: (client: Client | null) => void;
  onNitSelect: (nit: NIT | null) => void;
  onNotesChange: (notes: string) => void;
  onClientDiscountChange: (type: 'percentage' | 'fixed', value: number) => void;
  onPaymentMethodChange: (method: 'efectivo' | 'qr' ) => void;
  onConfirmSale: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const SaleClientAndSummary = memo(({
  saleState,
  onClientSelect,
  onNitSelect,
  onNotesChange,
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

  // Manejar selección de NIT
  const handleNitSelect = useCallback((nit: NIT | null) => {
    onNitSelect(nit);
  }, [onNitSelect]);

  // Manejar cambio de notas
  const handleNotesChange = useCallback((notes: string) => {
    onNotesChange(notes);
  }, [onNotesChange]);

  // Manejar cambio de método de pago
  const handlePaymentMethodChange = useCallback((method: 'efectivo' | 'qr' ) => {
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


      {/* Sección de NIT */}
      <NitSection
        selectedNitClient={saleState.nitClient}
        selectedSocialReasonClient={saleState.socialReasonClient}
        onNitSelect={handleNitSelect}
        disabled={isProcessing}
      />

      {/* Sección de notas de venta */}
      <SaleNotes
        notes={saleState.saleNotes}
        onNotesChange={handleNotesChange}
        disabled={isProcessing}
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
