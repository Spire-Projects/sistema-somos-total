import { memo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { ChevronDown, ChevronRight, Edit, Trash2, FileText, Package } from "lucide-react";
import type { SaleView } from "@/shared/types/modelTypes/Sale";

interface TableSalesMobileProps {
  sales: SaleView[];
  loading: boolean;
  searchQuery: string;
  onEdit?: (sale: SaleView) => void;
  onDelete?: (sale: SaleView) => void;
}

const TableSalesMobileComponent = ({
  sales,
  loading,
  searchQuery,
  onEdit,
  onDelete,
}: TableSalesMobileProps) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (saleId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number, currency: "bs" | "arg") => {
    return `${amount.toFixed(2)} ${currency === "bs" ? "Bs" : "ARS"}`;
  };

  const getPaymentMethodBadge = (method: "efectivo" | "qr") => {
    const variants = {
      efectivo: "default",
      qr: "secondary",
    } as const;
    
    const labels = {
      efectivo: "Efectivo",
      qr: "QR",
    };
    
    return (
      <Badge variant={variants[method]} className="text-xs">
        {labels[method]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="md:hidden space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="md:hidden">
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            {searchQuery
              ? `No se encontraron ventas`
              : "No hay ventas registradas"}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {searchQuery
              ? "Intenta con otro término"
              : "Comienza registrando tu primera venta"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4">
      {sales.map((sale) => {
        const isExpanded = expandedCards.has(sale.id);
        return (
          <Collapsible key={sale.id} open={isExpanded} onOpenChange={() => toggleCard(sale.id)}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        N° {sale.numberInvoice || "N/A"}
                      </span>
                      {sale.factured && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          Facturado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(sale.createdAt)}
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Información básica */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">
                      {sale.clientName || sale.client || "Sin cliente"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Método de pago:</span>
                    {getPaymentMethodBadge(sale.paymentMethod)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Moneda:</span>
                    <Badge variant="outline" className="uppercase text-xs">
                      {sale.paymentCurrency}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600 font-medium">Total:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(sale.total, sale.paymentCurrency)}
                    </span>
                  </div>
                </div>

                {/* Contenido expandible */}
                <CollapsibleContent>
                  <div className="pt-3 border-t space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Package className="h-4 w-4" />
                      Productos ({sale.items.length})
                    </div>
                    
                    {/* Lista de items */}
                    <div className="space-y-2">
                      {sale.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"
                        >
                          <div className="font-medium">{item.product}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            Lote: {item.purchaseBoxId}
                          </div>
                          <div className="flex justify-between items-center text-xs pt-1">
                            <span className="text-gray-600">
                              Cantidad: <span className="font-medium">{item.quantity}</span>
                            </span>
                            <span className="text-gray-600">
                              P. Unit: <span className="font-medium">
                                {formatCurrency(item.unitPrice, sale.paymentCurrency)}
                              </span>
                            </span>
                          </div>
                          {item.discount > 0 && (
                            <div className="text-xs text-red-600">
                              Descuento: -{formatCurrency(item.discount, sale.paymentCurrency)}
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                            <span className="text-xs text-gray-600">Subtotal:</span>
                            <span className="font-semibold">
                              {formatCurrency(item.total, sale.paymentCurrency)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Información adicional */}
                    {(sale.saleNotes || sale.nitClient || sale.socialReasonClient) && (
                      <div className="pt-2 border-t space-y-1 text-xs">
                        {sale.nitClient && (
                          <div>
                            <span className="text-gray-600">NIT:</span>{" "}
                            <span className="font-medium">{sale.nitClient}</span>
                          </div>
                        )}
                        {sale.socialReasonClient && (
                          <div>
                            <span className="text-gray-600">Razón Social:</span>{" "}
                            <span className="font-medium">{sale.socialReasonClient}</span>
                          </div>
                        )}
                        {sale.saleNotes && (
                          <div>
                            <span className="text-gray-600">Notas:</span>{" "}
                            <span className="italic">{sale.saleNotes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>

                {/* Acciones */}
                <div className="flex gap-2 pt-3 border-t">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(sale)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(sale)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

export const TableSalesMobile = memo(TableSalesMobileComponent);
