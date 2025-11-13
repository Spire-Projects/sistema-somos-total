import { memo, useEffect, useState } from "react";
import { toast } from "sonner";

import { SaleNotePreviewModal } from "../SaleNotePreviewModal";
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
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  FileText,
  FileCheck,
  Printer,
  Eye,
} from "lucide-react";
import type { SaleView } from "@/shared/types/modelTypes/Sale";
import type { Client } from "@/shared/types/Client";
import { productService } from "@/shared/services/ProductService";
import { getClientById } from "@/shared/services/ClientService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getPurchaseBoxRepository } from "@/shared/db/repositories/purchase.repository";
import { SaleNotePdfService } from "../../services/SaleNotePdfService";
import { salesService } from "@/shared/services/SalesService";

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
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [purchaseBoxReceipts, setPurchaseBoxReceipts] = useState<
    Record<string, string>
  >({});
  const [clientsData, setClientsData] = useState<Record<string, Client>>({});
  const [isDraft, setIsDraft] = useState<boolean>(false);

  useEffect(() => {
    setIsDraft(!sales.some((sale) => sale.isDraft));
  }, [sales]);

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

    return <Badge variant={variants[method]}>{labels[method]}</Badge>;
  };

  useEffect(() => {
    const ids = Array.from(
      new Set(sales.flatMap((sale) => sale.items.map((item) => item.product)))
    );
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => productService.findById(id))).then(
      (products) => {
        const mapping: Record<string, string> = {};
        products.forEach((prod, idx) => {
          if (prod) mapping[ids[idx]] = prod.name;
        });
        setProductNames(mapping);
      }
    );
  }, [sales]);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        sales.flatMap((sale) => sale.items.map((item) => item.purchaseBoxId))
      )
    );
    if (ids.length === 0) return;
    const repo = getPurchaseBoxRepository();
    Promise.all(ids.map((id) => repo.findById(id))).then((boxes) => {
      const mapping: Record<string, string> = {};
      boxes.forEach((box, idx) => {
        if (box) mapping[ids[idx]] = box.receiptNumber || ids[idx];
      });
      setPurchaseBoxReceipts(mapping);
    });
  }, [sales]);

  // Cargar datos de clientes
  useEffect(() => {
    const clientIds = Array.from(
      new Set(
        sales.filter((sale) => sale.client).map((sale) => sale.client as string)
      )
    );
    if (clientIds.length === 0) return;

    Promise.all(clientIds.map((id) => getClientById(id))).then((clients) => {
      const mapping: Record<string, Client> = {};
      clients.forEach((client, idx) => {
        if (client) mapping[clientIds[idx]] = client;
      });
      setClientsData(mapping);
    });
  }, [sales]);

  const handleInvoice = async (sale: SaleView) => {
    try {
      await salesService.update(sale.id, { factured: true });
      toast.success("Venta facturada correctamente.");
    } catch (err) {
      toast.error("Error al facturar la venta.");
    }
  };

  // Estado para la previsualización de nota de venta
  const [showSaleNoteModal, setShowSaleNoteModal] = useState(false);
  const [saleNotePdfUrl, setSaleNotePdfUrl] = useState<string | null>(null);
  const [isGeneratingSaleNote, setIsGeneratingSaleNote] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleView | null>(null);

  const handlePrintSaleNote = async (sale: SaleView) => {
    setIsGeneratingSaleNote(true);
    setSelectedSale(sale);
    try {
      // Generar PDF
      const pdf = SaleNotePdfService.generateSaleNotePdf({
        sale,
        noteNumber: sale.numberInvoice,
      });
      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setSaleNotePdfUrl(url);
      setShowSaleNoteModal(true);
      toast.success("Nota de venta generada correctamente.");
    } catch (err) {
      toast.error("Error al generar la nota de venta.");
    } finally {
      setIsGeneratingSaleNote(false);
    }
  };

  const handleCloseSaleNoteModal = () => {
    setShowSaleNoteModal(false);
    if (saleNotePdfUrl) {
      URL.revokeObjectURL(saleNotePdfUrl);
      setSaleNotePdfUrl(null);
    }
    setSelectedSale(null);
  };

  const handleDownloadSaleNotePdf = () => {
    if (!saleNotePdfUrl || !selectedSale) {
      toast.error("No se pudo descargar el PDF.");
      return;
    }
    const link = document.createElement("a");
    link.href = saleNotePdfUrl;
    link.download = SaleNotePdfService.generateFileName(
      selectedSale.clientName
    );
    link.click();
    toast.success("Descarga iniciada.");
  };

  const handlePrintSaleNotePdf = () => {
    if (!saleNotePdfUrl) {
      toast.error("No se pudo imprimir el PDF.");
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = saleNotePdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = function () {
      setTimeout(() => {
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
        toast.success("Enviado a impresión.");
      }, 100);
    };
  };

  const getClientInfo = (sale: SaleView) => {
    if (!sale.client) {
      return {
        name: "Sin cliente",
        email: "-",
        phone: "-",
      };
    }

    const client = clientsData[sale.client];
    return {
      name: client?.name || sale.clientName || "Sin cliente",
      email: client?.email || "-",
      phone: client?.phone || "-",
    };
  };

  const getNitInfo = (sale: SaleView) => {
    return {
      nit: sale.nitClient || "-",
      socialReason: sale.socialReasonClient || "-",
      invoiceNumber: sale.numberInvoice || "-",
    };
  };

  return (
    <Card className="hidden md:block">
      <CardHeader>
        <CardTitle>
          {isDraft ? "Lista de Ventas" : "Lista de cotizaciones"}{" "}
        </CardTitle>
        <CardDescription>
          {isDraft
            ? "Administra las ventas realizadas"
            : "Administra las cotizaciones realizadas"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando ventas...</span>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {searchQuery
                ? `No se encontraron ventas que coincidan con "${searchQuery}"`
                : "No hay ventas registradas"}
            </p>
            <p className="text-sm">
              {searchQuery
                ? "Intenta con otro término de búsqueda"
                : "Comienza registrando tu primera venta"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>
                    {isDraft ? "N° Venta" : "N° Cotización"}
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  {isDraft && <TableHead>Método Pago</TableHead>}
                  <TableHead>Moneda</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {isDraft && <TableHead>Facturado</TableHead>}
                  {!isDraft && (
                    <TableHead className="text-right">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const isExpanded = expandedRows.has(sale.id);
                  return (
                    <Collapsible
                      key={sale.id}
                      open={isExpanded}
                      onOpenChange={() => toggleRow(sale.id)}
                      asChild
                    >
                      <>
                        <TableRow>
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 h-6 w-6"
                              >
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
                            <span className="font-mono text-sm">
                              {sale.numberInvoice || "N/A"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm">
                              {sale.clientName || "Sin cliente"}
                            </span>
                          </TableCell>
                          {isDraft && (
                            <TableCell>
                              {getPaymentMethodBadge(sale.paymentMethod)}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge variant="outline" className="uppercase">
                              {sale.paymentCurrency}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(
                              sale.paymentCurrency === "arg"
                                ? sale.total * 200
                                : sale.total,
                              sale.paymentCurrency
                            )}
                          </TableCell>
                          {isDraft && (
                            <TableCell>
                              {sale.factured ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-600"
                                >
                                  Sí
                                </Badge>
                              ) : (
                                <Badge variant="secondary">No</Badge>
                              )}
                            </TableCell>
                          )}
                          {!isDraft && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {onEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(sale)}
                                    className="h-8 w-8 p-0"
                                    title="Revisar/Editar cotización"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">
                                      Revisar/Editar cotización
                                    </span>
                                  </Button>
                                )}
                                {onDelete && !isDraft && (
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
                          )}
                        </TableRow>
                        {/* Fila expandible con detalles de items */}
                        <CollapsibleContent asChild>
                          <TableRow>
                            <TableCell colSpan={9} className="bg-gray-50 p-0">
                              <div className="p-4 space-y-4">
                                {/* Sección de información del cliente */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                      Información del Cliente
                                    </h3>
                                    <div className="space-y-1 text-sm">
                                      <div>
                                        <span className="text-gray-600">
                                          Nombre:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {getClientInfo(sale).name}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Correo:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {getClientInfo(sale).email}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Teléfono:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {getClientInfo(sale).phone}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                      Información de Facturación
                                    </h3>
                                    <div className="space-y-1 text-sm">
                                      <div>
                                        <span className="text-gray-600">
                                          NIT:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {getNitInfo(sale).nit}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Razón Social:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {getNitInfo(sale).socialReason}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          N° Venta:
                                        </span>{" "}
                                        <span className="font-medium font-mono">
                                          {getNitInfo(sale).invoiceNumber}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {isDraft && (
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                      Acciones
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => handleInvoice(sale)}
                                        disabled={sale.factured}
                                      >
                                        <FileCheck className="h-4 w-4 mr-2" />
                                        {sale.factured
                                          ? "Facturado"
                                          : "Facturar Venta"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => {
                                          handlePrintSaleNote(sale);
                                        }}
                                      >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir Nota de Venta
                                      </Button>
                                    </div>
                                  </div>
                                  )}
                                </div>
                            

                                {/* Sección de productos vendidos */}
                                <div>
                                  <div className="font-semibold text-sm text-gray-700 mb-2">
                                    Productos vendidos ({sale.items.length})
                                  </div>
                                  {/* Tabla de items */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b">
                                          <th className="text-left py-2 px-3 font-medium text-gray-600">
                                            Producto
                                          </th>
                                          <th className="text-left py-2 px-3 font-medium text-gray-600">
                                            Lote
                                          </th>
                                          <th className="text-right py-2 px-3 font-medium text-gray-600">
                                            Cantidad
                                          </th>
                                          <th className="text-right py-2 px-3 font-medium text-gray-600">
                                            Precio Unit.
                                          </th>
                                          {isDraft && (
                                            <th className="text-right py-2 px-3 font-medium text-gray-600">
                                              Descuento
                                            </th>
                                          )}
                                          <th className="text-right py-2 px-3 font-medium text-gray-600">
                                            Total
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sale.items.map((item, idx) => (
                                          <tr
                                            key={idx}
                                            className="border-b last:border-0"
                                          >
                                            <td className="py-2 px-3">
                                              {productNames[item.product] ||
                                                item.product}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-xs">
                                              {purchaseBoxReceipts[
                                                item.purchaseBoxId
                                              ] || item.purchaseBoxId}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              {item.quantity}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              {formatCurrency(
                                                sale.paymentCurrency === "arg"
                                                  ? item.unitPrice * 200
                                                  : item.unitPrice,
                                                sale.paymentCurrency
                                              )}
                                            </td>
                                            {isDraft && (
                                              <td className="py-2 px-3 text-right text-red-600">
                                                {item.discount > 0
                                                  ? `-${formatCurrency(
                                                      sale.paymentCurrency ===
                                                        "arg"
                                                        ? item.discount * 200
                                                        : item.discount,
                                                      sale.paymentCurrency
                                                    )}`
                                                  : "-"}
                                              </td>
                                            )}
                                            <td className="py-2 px-3 text-right font-semibold">
                                              {formatCurrency(
                                                sale.paymentCurrency === "arg"
                                                  ? item.total * 200
                                                  : item.total,
                                                sale.paymentCurrency
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Información adicional (notas) */}
                                {sale.saleNotes && (
                                  <div className="pt-3 border-t">
                                    <div className="text-sm">
                                      <span className="text-gray-600 font-semibold">
                                        Notas:
                                      </span>{" "}
                                      <span className="italic">
                                        {sale.saleNotes}
                                      </span>
                                    </div>
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
        )}
      </CardContent>
      {/* Modal de previsualización de nota de venta */}
      <SaleNotePreviewModal
        open={showSaleNoteModal}
        onClose={handleCloseSaleNoteModal}
        pdfUrl={saleNotePdfUrl}
        onDownload={handleDownloadSaleNotePdf}
        onPrint={handlePrintSaleNotePdf}
        isGenerating={isGeneratingSaleNote}
      />
    </Card>
  );
};

export const TableSalesDesktop = memo(TableSalesDesktopComponent);
