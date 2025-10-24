import { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Pencil, Trash2, ShoppingCart } from "lucide-react";
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

const TablePurchaseDesktopComponent = ({
    purchases,
    loading,
    searchQuery,
    onEdit,
    onDelete
}: Props) => (
    <Card className="hidden md:block">
        <CardHeader>
            <CardTitle>Lista de Compras</CardTitle>
            <CardDescription>Administra las compras de productos</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando compras...</span>
                </div>
            ) : purchases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No hay compras registradas</p>
                    <p className="text-sm">
                        {searchQuery
                            ? "No se encontraron compras con ese criterio de búsqueda"
                            : "Comienza registrando tu primera compra"}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Comprobante</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Costo Unit.</TableHead>
                                <TableHead className="text-right">Total</TableHead>

                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases.map((purchase) => (
                                <TableRow key={purchase.id} className="cursor-pointer hover:bg-gray-50">
                                    <TableCell>
                                        {purchase.receiptNumber ? (
                                            <span className="text-sm">{purchase.receiptNumber}</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Sin comprobante</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {formatDate(purchase.purchaseDate)}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{purchase.productName || 'Producto no encontrado'}</p>
                                            {purchase.supplierName && (
                                                <p className="text-xs text-gray-500 truncate max-w-xs">
                                                    {purchase.supplierName}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {purchase.productCode ? (
                                            <Badge variant="secondary">{purchase.productCode}</Badge>
                                        ) : (
                                            <span className="text-gray-400 text-xs">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {purchase.quantity}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(purchase.unitCost)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {formatCurrency(purchase.totalCost)}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(purchase)}
                                                title="Editar compra"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(purchase)}
                                                title="Eliminar compra"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
    </Card>
);

TablePurchaseDesktopComponent.displayName = 'TablePurchaseDesktop';

export default memo(TablePurchaseDesktopComponent);
