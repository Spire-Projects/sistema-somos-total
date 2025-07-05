import { memo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Info, Trash2, Minus, Plus, Calendar, Package2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/shared/services/BatchService';
import type { SaleItem } from '../types/sale.types';
import MedicationDetailModal from './MedicationDetailModal.tsx';

interface SaleItemsTableProps {
  items: SaleItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateDiscount: (itemId: string, discount: number) => void;
  onRemove: (itemId: string) => void;
}

const SaleItemsTable = memo(({ items, onUpdateQuantity, onUpdateDiscount, onRemove }: SaleItemsTableProps) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<SaleItem | null>(null);

  // Manejar apertura del modal de detalles
  const handleShowDetails = (item: SaleItem) => {
    setSelectedMedication(item);
    setDetailModalOpen(true);
  };

  // Manejar cambio de cantidad
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  // Manejar cambio de descuento
  const handleDiscountChange = (itemId: string, newDiscount: number) => {
    if (newDiscount >= 0) {
      onUpdateDiscount(itemId, newDiscount);
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 text-center border-r border-gray-200">No.</TableHead>
              <TableHead className="min-w-[200px] border-r border-gray-200">Nombre Item</TableHead>
              <TableHead className="w-20 text-center border-r border-gray-200">Cantidad</TableHead>
              <TableHead className="w-20 text-right border-r border-gray-200">Precio Lista</TableHead>
              <TableHead className="w-20 text-right border-r border-gray-200">Descuento</TableHead>
              <TableHead className="w-20 text-right border-r border-gray-200">Precio Venta</TableHead>
              <TableHead className="w-20 text-right border-r border-gray-200">Subtotal</TableHead>
              <TableHead className="w-16 text-center border-r border-gray-200">Detalle</TableHead>
              <TableHead className="w-16 text-center">Eliminar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                {/* No. */}
                <TableCell className="text-center font-medium text-sm border-r border-gray-200">
                  {index + 1}
                </TableCell>

                {/* Nombre Item */}
                <TableCell className="border-r border-gray-200">
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-gray-900">
                      {item.medication.comercialName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.medication.genericName}
                    </p>
                    {item.medication.concentration && (
                      <p className="text-xs text-gray-500">
                        {item.medication.concentration}
                      </p>
                    )}
                    {/* Información del lote */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700">
                        <Package2 className="h-3 w-3" />
                        Lote: {item.batchInfo.batchId}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.batchInfo.expirationDate)}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Cantidad */}
                <TableCell className="border-r border-gray-200">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="h-6 w-6 p-0"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-12 h-6 text-center text-xs p-1"
                      min="1"
                      max={item.batchInfo.availableStock}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="h-6 w-6 p-0"
                      disabled={item.quantity >= item.batchInfo.availableStock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Stock: {item.batchInfo.availableStock}
                  </p>
                </TableCell>

                {/* Precio Lista */}
                <TableCell className="text-right font-medium text-sm border-r border-gray-200">
                  {item.listPrice ? formatCurrency(item.listPrice) : formatCurrency(item.unitPrice + (item.discount || 0))}
                </TableCell>

                {/* Descuento */}
                <TableCell className="text-center border-r border-gray-200">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Bs</span>
                    <Input
                      type="number"
                      value={item.discount || ''}
                      onChange={(e) => handleDiscountChange(item.id, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-14 h-6 text-center text-xs p-1 border-gray-300"
                      min="0"
                      max={item.listPrice || item.unitPrice + (item.discount || 0)}
                      step="0.01"
                    />
                  </div>
                </TableCell>

                {/* Precio Venta */}
                <TableCell className="text-right font-medium text-sm border-r border-gray-200">
                  {formatCurrency(item.unitPrice)}
                </TableCell>

                {/* Subtotal */}
                <TableCell className="text-right font-medium text-sm border-r border-gray-200">
                  {formatCurrency(item.total)}
                </TableCell>

                {/* Detalle */}
                <TableCell className="text-center border-r border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowDetails(item)}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TableCell>

                {/* Eliminar */}
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de detalles del medicamento */}
      <MedicationDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        medicationItem={selectedMedication}
      />
    </>
  );
});

SaleItemsTable.displayName = 'SaleItemsTable';

export default SaleItemsTable;
