import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Loader2 } from "lucide-react";
// Modal bloqueante con loader y mensajes animados
function ResolvingTemporaryNumbersModal({ open, messages }: { open: boolean; messages: string[] }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      setMessageIndex(0);
      intervalRef.current = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, messages.length]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
  <DialogContent className="flex flex-col items-center gap-4 select-none" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Actualizando números de venta</DialogTitle>
        </DialogHeader>
        <Loader2 className="animate-spin text-blue-600 w-12 h-12 mx-auto" />
        <div className="text-lg font-medium text-center min-h-[2.5rem]">
          {messages[messageIndex]}
        </div>
        <div className="text-xs text-gray-400 text-center">Por favor espera, este proceso es automático y puede tardar unos segundos...</div>
      </DialogContent>
    </Dialog>
  );
}
import { Button } from "@/shared/components/ui/button.tsx";
import { Input } from "@/shared/components/ui/input.tsx";
import { BriefcaseMedical, Search } from "lucide-react";
import NewSaleDialog from "./NewSaleDialog.tsx";
import SalesFilters from "./SalesFilters";
import SalesTable from "./SalesTable";
import { DataPagination } from "@/shared/components/DataPagination";
import { useSalesSearch } from "../hooks/useSalesSearch";
import { InvoiceNumberService } from "@/shared/services/InvoiceNumberService.ts";
import { toast } from "sonner";

export const SalesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolvingModalOpen, setResolvingModalOpen] = useState(false);

  // Mensajes animados para el modal
  const resolvingMessages = [
    "Actualizando números de nota de venta...",
    "Ya casi terminamos...",
    "Sincronizando con el servidor...",
    "Verificando integridad de datos...",
    "¡No cierres la ventana!",
  ];

  const {
    sales,
    isLoading,
    error,
    pagination,
    filters,
    setSearchQuery,
    setDateRange,
    clearFilters,
    changePage,
    changeItemsPerPage,
    refetch,
  } = useSalesSearch(300);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  const handleDateRangeChange = useCallback(
    (dateFrom?: string, dateTo?: string) => {
      setDateRange(dateFrom, dateTo);
    },
    [setDateRange]
  );

  useEffect(() => {
    const runResolve = async () => {
      if (!navigator.onLine) return;

      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        const numberTemporary = await InvoiceNumberService.getTemporaryNumberCount();
        if (numberTemporary === 0) {
          return;
        }
        setResolvingModalOpen(true);
        const response = await InvoiceNumberService.resolveTemporaryNumbers();
        setResolvingModalOpen(false);
        if (response) {
          toast.success("✅ Números de venta temporales resueltos correctamente");
          refetch();
        }
      } catch (err) {
        setResolvingModalOpen(false);
        toast.error("Error resolviendo números de venta temporales, revise la conexión a internet");
      }
    };

    runResolve();
    const onOnline = () => runResolve();
    window.addEventListener("online", onOnline);

    return () => window.removeEventListener("online", onOnline);
  }, []);

  return (
    <>
      <ResolvingTemporaryNumbersModal open={resolvingModalOpen} messages={resolvingMessages} />
      <div className="min-h-screen bg-gray-50">
      <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg self-center mt-1">
              <BriefcaseMedical className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Ventas
              </p>
              <p className="text-gray-500 text-sm sm:text-gray-600">
                Registra una nueva venta o consulta las ventas registradas
              </p>
            </div>
          </div>
        </div>

        {/* Búsqueda y Acciones */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por método de pago o numero de venta"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="pl-10 border-gray-300"
            />
          </div>
          <div>
            <Button variant="default" onClick={() => setDialogOpen(true)}>
              Nueva venta
            </Button>
          </div>
        </div>

        {/* Filtros de fecha */}
        <SalesFilters
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={clearFilters}
        />

        {/* Tabla de ventas */}
        <SalesTable sales={sales} isLoading={isLoading} error={error} />

        {/* Paginación */}
        {!isLoading && sales.length > 0 && (
          <DataPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={changePage}
            onItemsPerPageChange={changeItemsPerPage}
            startIndex={
              (pagination.currentPage - 1) * pagination.itemsPerPage + 1
            }
            endIndex={Math.min(
              pagination.currentPage * pagination.itemsPerPage,
              pagination.totalItems
            )}
            itemName="ventas"
          />
        )}
      </div>

      {/* Diálogo de nueva venta */}
      <NewSaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaleSuccess={refetch}
      />
    </div>
    </>
  );
}
