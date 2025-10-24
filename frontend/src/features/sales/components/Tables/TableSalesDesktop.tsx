import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ChevronDown, ChevronRight, Edit, Trash2, FileText } from "lucide-react";
import type { SaleView } from "@/shared/types/modelTypes/Sale";
import { useState } from "react";

interface TableSalesDesktopProps {
  sales: SaleView[];
  loading: boolean;
  searchQuery: string;
  onEdit?: (sale: SaleView) => void;
  onDelete?: (sale: SaleView) => void;
}

const TableSalesDesktopComponent = ({
  sales,
  loading,
  searchQuery,
  onEdit,
  onDelete,
}: TableSalesDesktopProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (saleId: string) => {
    setExpandedRows((prev) => {
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
      <Badge variant={variants[method]}>
        {labels[method]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>N° Venta</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Método Pago</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Facturado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="hidden md:block rounded-md border p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">
          {searchQuery
            ? `No se encontraron ventas que coincidan con "${searchQuery}"`
            : "No hay ventas registradas"}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          {searchQuery
            ? "Intenta con otro término de búsqueda"
            : "Comienza registrando tu primera venta"}
        </p>
      </div>
    );
  }

  return (
    <div className="hidden md:block rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>N° Venta</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Método Pago</TableHead>
            <TableHead>Moneda</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Facturado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const isExpanded = expandedRows.has(sale.id);
            return (
              <Collapsible key={sale.id} open={isExpanded} onOpenChange={() => toggleRow(sale.id)} asChild>
                <>
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {formatDate(sale.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{sale.numberInvoice || "N/A"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{sale.clientName || sale.client || "Sin cliente"}</span>
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodBadge(sale.paymentMethod)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {sale.paymentCurrency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(sale.total, sale.paymentCurrency)}
                    </TableCell>
                    <TableCell>
                      {sale.factured ? (
                        <Badge variant="default" className="bg-green-600">Sí</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(sale)}
                            className="h-8 w-8 p-0"
                            title="Editar venta"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(sale)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar venta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Fila expandible con detalles de items */}
                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={9} className="bg-gray-50 p-0">
                        <div className="p-4 space-y-3">
                          <div className="font-semibold text-sm text-gray-700 mb-2">
                            Productos vendidos ({sale.items.length})
                          </div>
                          
                          {/* Tabla de items */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-medium text-gray-600">Producto</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-600">Lote</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-600">Cantidad</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-600">Precio Unit.</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-600">Descuento</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-600">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sale.items.map((item, idx) => (
                                  <tr key={idx} className="border-b last:border-0">
                                    <td className="py-2 px-3">{item.product}</td>
                                    <td className="py-2 px-3 font-mono text-xs">{item.purchaseBoxId}</td>
                                    <td className="py-2 px-3 text-right">{item.quantity}</td>
                                    <td className="py-2 px-3 text-right">
                                      {formatCurrency(item.unitPrice, sale.paymentCurrency)}
                                    </td>
                                    <td className="py-2 px-3 text-right text-red-600">
                                      {item.discount > 0 ? `-${formatCurrency(item.discount, sale.paymentCurrency)}` : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right font-semibold">
                                      {formatCurrency(item.total, sale.paymentCurrency)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Información adicional */}
                          {(sale.saleNotes || sale.nitClient || sale.socialReasonClient) && (
                            <div className="mt-3 pt-3 border-t space-y-1 text-sm">
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
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export const TableSalesDesktop = memo(TableSalesDesktopComponent);
