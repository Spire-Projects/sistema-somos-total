import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Loader2, BriefcaseMedical } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { InvoiceNumberService } from "@/shared/services/InvoiceNumberService";
import { toast } from "sonner";
import PageHeader from "@/shared/components/PageHeader";
import SearchInput from "@/shared/components/SearchInput";
import { DataPagination } from "@/shared/components/DataPagination";
import StartAppText from "@/shared/components/StartAppText";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { salesService } from "@/shared/services/SalesService";
import type { Sale, SaleView, SaleFilter } from "@/shared/types/modelTypes/Sale";
import { TableSalesDesktop } from "./Tables/TableSalesDesktop";
import { TableSalesMobile } from "./Tables/TableSalesMobile";
import CreateSaleModal from "./CreateSaleModal";

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
    <Dialog open={open} onOpenChange={() => { }}>
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

export const SalesPage = () => {
  const [resolvingModalOpen, setResolvingModalOpen] = useState(false);
  const [createSaleModalOpen, setCreateSaleModalOpen] = useState(false);

  // Mensajes animados para el modal
  const resolvingMessages = [
    "Actualizando números de nota de venta...",
    "Ya casi terminamos...",
    "Sincronizando con el servidor...",
    "Verificando integridad de datos...",
    "¡No cierres la ventana!",
  ];

  // Hook de useEntityData para gestionar ventas
  const {
    // Data
    items: sales,
    loading,
    error,

    // Pagination
    currentPage,
    pageSize,
    totalItems,
    totalPages,

    // Search & Filters
    searchQuery,

    // Actions - Pagination
    setPage,
    setPageSize,

    // Actions - Search & Filters
    setSearch,

    // Actions - General
    refresh,
  } = useEntityData<Sale, SaleView, SaleFilter>(salesService, {
    initialPageSize: 10,
    enableRealtime: true,
  });

  // Resolver números temporales al cargar
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
          refresh();
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
  }, [refresh]);

  // Handler para manejar errores
  if (error) {
    if (error.includes("Inicializando base de datos")) {
      return <StartAppText error={error} />;
    }

    return (
      <div className="p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">
            Error al cargar ventas
          </h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Intentar nuevamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ResolvingTemporaryNumbersModal open={resolvingModalOpen} messages={resolvingMessages} />
      <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
        <PageHeader
          title="Ventas"
          subtitle="Gestiona las ventas realizadas en el sistema"
          icon={<BriefcaseMedical className="w-6 h-6 text-blue-600" />}
        />

        {/* Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearch}
            isLoading={loading}
          />
          <Button
            variant="default"
            onClick={() => setCreateSaleModalOpen(true)}
            disabled={loading}
          >
            Nueva venta
          </Button>
        </div>

        {/* Tabla Desktop */}
        <TableSalesDesktop
          sales={sales}
          loading={loading}
          searchQuery={searchQuery}
          onEdit={(sale) => {
            // TODO: Implementar edición
            toast.info("Edición de venta próximamente");
          }}
          onDelete={(sale) => {
            // TODO: Implementar eliminación
            toast.info("Eliminación de venta próximamente");
          }}
        />

        {/* Tabla Mobile */}
        <TableSalesMobile
          sales={sales}
          loading={loading}
          searchQuery={searchQuery}
          onEdit={(sale) => {
            // TODO: Implementar edición
            toast.info("Edición de venta próximamente");
          }}
          onDelete={(sale) => {
            // TODO: Implementar eliminación
            toast.info("Eliminación de venta próximamente");
          }}
        />

        {/* Paginación */}
        {!loading && totalItems > 0 && (
          <div className="w-full">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={setPage}
              onItemsPerPageChange={setPageSize}
              startIndex={(currentPage - 1) * pageSize + 1}
              endIndex={Math.min(currentPage * pageSize, totalItems)}
              itemName="ventas"
            />
          </div>
        )}
      </div>

      {/* Modal de creación de venta */}
      <CreateSaleModal
        open={createSaleModalOpen}
        onClose={() => setCreateSaleModalOpen(false)}
        onSaleCreated={refresh}
      />
    </>
  );
};
