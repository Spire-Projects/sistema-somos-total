import { memo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Trash2, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/shared/services/BatchService';
import type { SaleItem } from '../types/sale.types';

interface SaleItemRowProps {
  item: SaleItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

const SaleItemRow = memo(({ item, onUpdateQuantity, onRemove }: SaleItemRowProps) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-white">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {item.medication.comercialName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {item.medication.tradeName}
        </p>
        <p className="text-xs text-green-600">
          {formatCurrency(item.unitPrice)} c/u
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="h-7 w-7 p-0"
          disabled={item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          className="w-16 h-7 text-center text-sm"
          min="1"
          max={item.medication.totalActiveStock}
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="h-7 w-7 p-0"
          disabled={item.quantity >= item.medication.totalActiveStock}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="text-right min-w-[60px]">
        <p className="text-sm font-medium text-gray-900">
          {formatCurrency(item.totalPrice)}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onRemove(item.id)}
        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
});

SaleItemRow.displayName = 'SaleItemRow';

export default SaleItemRow;
