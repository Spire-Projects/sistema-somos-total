import React from 'react';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { QrCode, DollarSign } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: 'efectivo' | 'qr' ;
  onPaymentMethodChange: (method: 'efectivo' | 'qr' ) => void;
  disabled?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onPaymentMethodChange,
  disabled = false
}) => {
  const paymentMethods = [
    { 
      id: 'efectivo' as const, 
      label: 'Efectivo', 
      icon: DollarSign
    },
    { 
      id: 'qr' as const, 
      label: 'QR', 
      icon: QrCode
    }
  ];

  const getMethodIcon = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.icon || DollarSign;
  };

  const getMethodLabel = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.label || 'Seleccionar';
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        Método de Pago
      </Label>
      <Select 
        value={selectedMethod} 
        onValueChange={onPaymentMethodChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-9">
          <SelectValue className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {React.createElement(getMethodIcon(selectedMethod), { 
                className: "h-4 w-4" 
              })}
              <span>{getMethodLabel(selectedMethod)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <SelectItem key={method.id} value={method.id}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{method.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PaymentMethodSelector;
