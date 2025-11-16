import { useState, useCallback } from 'react';

const argentineDenominations = [
  { label: '1000 ARS', value: 1000 },
  { label: '500 ARS', value: 500 },
  { label: '200 ARS', value: 200 },
  { label: '100 ARS', value: 100 },
  { label: '50 ARS', value: 50 },
  { label: '20 ARS', value: 20 },
  { label: '10 ARS', value: 10 },
];

export function useArgCashBreakdown() {
  const [quantities, setQuantities] = useState<string[]>(
    argentineDenominations.map(() => '0')
  );

  const updateQuantity = useCallback((index: number, value: string) => {
    setQuantities((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const calculateTotal = useCallback(() => {
    return quantities.reduce((sum, q, i) => {
      const qty = Number(q) || 0;
      return sum + qty * argentineDenominations[i].value;
    }, 0);
  }, [quantities]);

  const reset = useCallback(() => {
    setQuantities(argentineDenominations.map(() => '0'));
  }, []);

  return {
    quantities,
    updateQuantity,
    calculateTotal,
    reset,
    denominations: argentineDenominations,
  };
}
