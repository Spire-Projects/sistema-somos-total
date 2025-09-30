import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Package, Calendar, Factory } from "lucide-react";
import type { MedicationCatalogView } from "@/shared/types/MedicationViewTypes";

function formatDate(dateString?: string) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MedicationDetailsDialog({
  medication,
  open,
  onOpenChange,
}: {
  medication?: MedicationCatalogView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* We don't render a trigger here; the parent will control open state */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            { "Detalles del medicamento"}
          </DialogTitle>
        </DialogHeader>

        {medication ? (
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Nombre Comercial</div>
                <div className="font-medium">{medication.tradeName}</div>
                {medication.comercialName && (
                  <div className="text-xs text-gray-500">{medication.comercialName}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Stock</div>
                <div className="font-medium flex items-center gap-1 justify-end">
                  <Package className="h-4 w-4 text-gray-400" />
                  {medication.totalActiveStock}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Nombre Genérico</div>
                <div className="font-medium">{medication.genericName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Marca / Fabricante</div>
                <div className="font-medium flex items-center gap-2">
                  <Factory className="h-4 w-4 text-gray-400" />
                  <span>{medication.manufacturerName ?? "-"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Concentración</div>
                <div className="font-medium">{medication.concentration ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Presentación</div>
                <div className="font-medium">{medication.presentation ?? "-"}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Categoría</div>
              <div className="font-medium">{medication.categoryName ?? "-"}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Forma Farmacéutica</div>
                <div className="font-medium">{medication.pharmaceuticalFormName ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Requiere Receta</div>
                <div className="font-medium">
                  <Badge variant={medication.prescriptionRequired ? "destructive" : "default"} className="text-xs">
                    {medication.prescriptionRequired ? "Sí" : "No"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Estado de stock</div>
              <div className="mt-1">{
                (() => {
                  switch (medication.stockStatus) {
                    case "in_stock":
                      return <Badge className="text-xs">En Stock</Badge>;
                    case "low_stock":
                      return <Badge variant="secondary" className="text-xs">Stock Bajo</Badge>;
                    case "out_of_stock":
                      return <Badge variant="destructive" className="text-xs">Sin Stock</Badge>;
                    case "overstocked":
                      return <Badge className="text-xs">En Stock</Badge>;
                    default:
                      return <Badge className="text-xs">-</Badge>;
                  }
                })()
              }</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Lotes activos</div>
              <div className="mt-1 text-sm text-gray-700">
                {medication.activeBatchCount ?? 0} lote(s)
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Vencimiento del lote más antiguo</div>
              {medication.oldestActiveBatch ? (
                <div className="flex items-center gap-3 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium">{formatDate(medication.oldestActiveBatch.expirationDate)}</div>
                    <div className="text-xs text-gray-500">{medication.oldestActiveBatch.daysToExpiration}d restantes</div>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-xs text-gray-400">-</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Creado</div>
                <div className="font-medium">{formatDate(medication.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Actualizado</div>
                <div className="font-medium">{formatDate(medication.updatedAt)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-gray-500">No hay datos</div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button>Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
