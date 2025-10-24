import { memo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Pencil, Trash2, ShoppingCart, Calendar, Package, Receipt } from "lucide-react";
import type { PurchaseView } from "@/shared/types/modelTypes/PurchaseBox";

interface Props {
  purchases: PurchaseView[];
  loading: boolean;
  searchQuery: string;
  onEdit: (purchase: PurchaseView) => void;
  onDelete: (purchase: PurchaseView) => void;
}

/**
 * Formatea un número como moneda
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formatea una fecha ISO a formato local
 */
const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const TablePurchaseMobileComponent = ({ 
  purchases, 
  loading, 
  searchQuery, 
  onEdit, 
  onDelete 
}: Props) => (
  <div className="md:hidden space-y-4">
    {loading ? (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando compras...</span>
      </div>
    ) : purchases.length === 0 ? (
      <Card>
        <CardContent className="text-center py-8">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-700">No hay compras</p>
          <p className="text-sm text-gray-500">
            {searchQuery
              ? "No se encontraron compras"
              : "Comienza registrando tu primera compra"}
          </p>
        </CardContent>
      </Card>
    ) : (
      purchases.map((purchase) => (
        <Card key={purchase.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">
                  {purchase.productName || 'Producto no encontrado'}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(purchase.purchaseDate)}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-green-600 bg-green-50">
                {formatCurrency(purchase.totalCost)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Código del producto */}
            {purchase.productCode && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Código:
                </span>
                <Badge variant="outline">{purchase.productCode}</Badge>
              </div>
            )}
            
            {/* Cantidad */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Cantidad:</span>
              <span className="font-semibold">{purchase.quantity}</span>
            </div>
            
            {/* Costo unitario */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Costo unitario:</span>
              <span className="font-semibold">{formatCurrency(purchase.unitCost)}</span>
            </div>
            
            {/* Comprobante */}
            {purchase.receiptNumber && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  Comprobante:
                </span>
                <span className="text-xs">{purchase.receiptNumber}</span>
              </div>
            )}
            
            {/* Notas */}
            {purchase.notes && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                <strong>Notas:</strong> {purchase.notes}
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(purchase)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(purchase)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))
    )}
  </div>
);

TablePurchaseMobileComponent.displayName = 'TablePurchaseMobile';

export default memo(TablePurchaseMobileComponent);
