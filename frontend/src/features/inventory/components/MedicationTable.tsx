import { memo, useCallback } from "react";
import { ArrowUpDown, Package, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { MedicationMobileList } from "./MedicationMobileList";
import type {
  MedicationCatalogView,
  MedicationCatalogSort,
  MedicationCatalogSortField,
} from "@/shared/types/MedicationViewTypes";
import AddMedicationDialog from "./AddMedicationDialog";

interface MedicationTableProps {
  medications: MedicationCatalogView[];
  loading?: boolean;
  sort?: MedicationCatalogSort;
  onSort?: (sort: MedicationCatalogSort) => void;
  onRowClick?: (medication: MedicationCatalogView) => void;
  handleRefresh: () => void;
}

const SORTABLE_COLUMNS: Record<MedicationCatalogSortField, string> = {
  tradeName: "Nombre Comercial",
  genericName: "Nombre Genérico",
  comercialName: "Marca",
  categoryName: "Categoría",
  manufacturerName: "Fabricante",
  totalActiveStock: "Stock",
  activeBatchCount: "Lotes",
  createdAt: "Creado",
  updatedAt: "Actualizado",
};

const getStockStatusBadge = (status: MedicationCatalogView["stockStatus"]) => {
  const variants = {
    in_stock: { variant: "default" as const, label: "En Stock" },
    low_stock: { variant: "secondary" as const, label: "Stock Bajo" },
    out_of_stock: { variant: "destructive" as const, label: "Sin Stock" },
    overstocked: { variant: "outline" as const, label: "Exceso" },
  };

  const config = variants[status];
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const LoadingSkeleton = memo(() => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-6 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
  </TableRow>
));

LoadingSkeleton.displayName = "LoadingSkeleton";

export const MedicationTable = memo<MedicationTableProps>(
  ({
    medications,
    loading = false,
    sort,
    onSort,
    onRowClick,
    handleRefresh,
  }) => {
    const handleSort = useCallback(
      (field: MedicationCatalogSortField) => {
        if (!onSort) return;

        const newOrder =
          sort?.field === field && sort.order === "asc" ? "desc" : "asc";
        onSort({ field, order: newOrder });
      },
      [sort, onSort]
    );

    const getSortIcon = useCallback(
      (field: MedicationCatalogSortField) => {
        if (sort?.field !== field) return <ArrowUpDown className="h-3 w-3" />;
        return sort.order === "asc" ? "↑" : "↓";
      },
      [sort]
    );

    const handleRowClick = useCallback(
      (medication: MedicationCatalogView) => {
        onRowClick?.(medication);
      },
      [onRowClick]
    );

    return (
      <>
        {/* Mobile View - Hidden on MD and above */}
        <div className="md:hidden">
          <MedicationMobileList
            medications={medications}
            loading={loading}
            sort={sort}
            onSort={onSort}
            onRowClick={onRowClick}
          />
        </div>

        {/* Desktop/Tablet View - Hidden below MD */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("tradeName")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    {SORTABLE_COLUMNS.tradeName}
                    {getSortIcon("tradeName")}
                  </Button>
                </TableHead>
                <TableHead className="w-[180px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("genericName")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    {SORTABLE_COLUMNS.genericName}
                    {getSortIcon("genericName")}
                  </Button>
                </TableHead>
                <TableHead>Concentración</TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("totalActiveStock")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Stock
                    {getSortIcon("totalActiveStock")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("activeBatchCount")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Lotes
                    {getSortIcon("activeBatchCount")}
                  </Button>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <LoadingSkeleton key={index} />
                ))
              ) : medications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No se encontraron medicamentos
                  </TableCell>
                </TableRow>
              ) : (
                medications.map((medication) => (
                  <TableRow
                    key={medication.id}
                    className={
                      onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                    }
                    onClick={() => handleRowClick(medication)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">
                          {medication.tradeName}
                        </div>
                        {medication.comercialName && (
                          <div className="text-xs text-gray-500">
                            {medication.comercialName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{medication.genericName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{medication.concentration}</div>
                      <div className="text-xs text-gray-500">
                        {medication.presentation}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">
                          {medication.totalActiveStock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-gray-600">
                        {medication.activeBatchCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStockStatusBadge(medication.stockStatus)}
                    </TableCell>
                    <TableCell>
                      {medication.oldestActiveBatch ? (
                        <div className="flex items-center gap-1">
                          {medication.oldestActiveBatch.daysToExpiration <=
                            30 && (
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          )}
                          <div className="text-xs">
                            <div>
                              {formatDate(
                                medication.oldestActiveBatch.expirationDate
                              )}
                            </div>
                            <div className="text-gray-500">
                              {medication.oldestActiveBatch.daysToExpiration}d
                              restantes
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <AddMedicationDialog
                        medicationId={medication.id}
                        onMedicationAdded={handleRefresh}
                        edit
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }
);

MedicationTable.displayName = "MedicationTable";
