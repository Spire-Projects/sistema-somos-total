import { memo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import type { CartSaleItem } from "@/shared/types/modelTypes/Sale";

interface SaleItemsTableProps {
  items: CartSaleItem[];
  onUpdateQuantity: (purchaseBoxId: string, quantity: number) => void;
  onUpdateDiscount: (purchaseBoxId: string, discount: number) => void;
  onRemoveItem: (purchaseBoxId: string) => void;
  disabled?: boolean;
}

const SaleItemsTable = memo(({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
  disabled = false
}: SaleItemsTableProps) => {

  const handleIncrement = useCallback((item: CartSaleItem) => {
    if (item.quantity < item.availableStock) {
      onUpdateQuantity(item.purchaseBoxId, item.quantity + 1);
    }
  }, [onUpdateQuantity]);

  const handleDecrement = useCallback((item: CartSaleItem) => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.purchaseBoxId, item.quantity - 1);
    }
  }, [onUpdateQuantity]);

  const handleQuantityChange = useCallback((item: CartSaleItem, value: string) => {
    const quantity = parseInt(value) || 1;
    const validQuantity = Math.min(Math.max(quantity, 1), item.availableStock);
    onUpdateQuantity(item.purchaseBoxId, validQuantity);
  }, [onUpdateQuantity]);

  const handleDiscountChange = useCallback((purchaseBoxId: string, value: string) => {
    const discount = parseFloat(value) || 0;
    const validDiscount = Math.min(Math.max(discount, 0), 100);
    onUpdateDiscount(purchaseBoxId, validDiscount);
  }, [onUpdateDiscount]);

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Items de Venta (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            <ShoppingCart className="h-16 w-16 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No hay productos en el carrito</p>
            <p className="text-xs mt-1">Busca y agrega productos para comenzar la venta</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Items de Venta ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10">No.</TableHead>
                <TableHead className="min-w-[200px]">Nombre Item</TableHead>
                <TableHead className="min-w-[120px]">Cantidad</TableHead>
                <TableHead className="w-[120px]">Precio Lista</TableHead>
                <TableHead className="w-[100px]">
                  Descuento
                  <br />
                  <span className="text-xs font-normal text-gray-500">Unidad</span>
                </TableHead>
                <TableHead className="w-[120px]">
                  Precio Venta
                  <br />
                  <span className="text-xs font-normal text-gray-500">Unidad</span>
                </TableHead>
                <TableHead className="w-[120px]">Subtotal</TableHead>
                <TableHead className="w-20">Detalle</TableHead>
                <TableHead className="w-20 text-center">Eliminar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.purchaseBoxId} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-center">
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{item.productName}</div>
                      {item.productCode && (
                        <Badge variant="outline" className="text-xs">
                          {item.productCode}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecrement(item)}
                        disabled={disabled || item.quantity <= 1}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item, e.target.value)}
                        disabled={disabled}
                        min={1}
                        max={item.availableStock}
                        className="h-7 w-16 text-center text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIncrement(item)}
                        disabled={disabled || item.quantity >= item.availableStock}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      Stock: {item.availableStock}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="font-medium">Bs {item.originalPrice.toFixed(2)}</div>
                    {item.profitMarginPercentage && (
                      <div className="text-xs text-gray-500">
                        +{item.profitMarginPercentage}% ganancia
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleDiscountChange(item.purchaseBoxId, e.target.value)}
                        disabled={disabled}
                        min={0}
                        max={100}
                        step={0.1}
                        className="h-7 w-16 text-sm"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="font-medium text-green-600">
                      Bs {item.unitPrice.toFixed(2)}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="font-bold text-blue-600">
                      Bs {item.total.toFixed(2)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Compra:</span> {formatDate(item.purchaseDate)}
                      </div>
                      {item.receiptNumber && (
                        <div>
                          <span className="font-medium">Recibo:</span> {item.receiptNumber}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Costo:</span> Bs {item.unitCost.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveItem(item.purchaseBoxId)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('¿Estás seguro de limpiar todos los items del carrito?')) {
                items.forEach(item => onRemoveItem(item.purchaseBoxId));
              }
            }}
            disabled={disabled}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Todo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

SaleItemsTable.displayName = 'SaleItemsTable';

export default SaleItemsTable;
