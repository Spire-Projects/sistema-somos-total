import { useState, useEffect, useRef } from "react";
import { BriefcaseMedical } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { InvoiceNumberService } from "@/shared/services/InvoiceNumberService";
import { toast } from "sonner";
import PageHeader from "@/shared/components/PageHeader";
import SearchInput from "@/shared/components/SearchInput";
import { DataPagination } from "@/shared/components/DataPagination";
import StartAppText from "@/shared/components/StartAppText";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { salesService } from "@/shared/services/SalesService";
import type {
  Sale,
  SaleView,
  SaleFilter,
} from "@/shared/types/modelTypes/Sale";
import { TableSalesDesktop } from "../components/Tables/TableSalesDesktop";
import { TableSalesMobile } from "../components/Tables/TableSalesMobile";
import { FilterTabs } from "@/shared/components/FilterTabs";
import CreateSaleModal from "../components/CreateSaleModal";
import { ResolvingTemporaryNumbersModal } from "../components/SolverNumberModal";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/shared/components/ui/select";

export const SalesPage = () => {
  const [activeSection, setActiveSection] = useState<string>("ventas");
  const [resolvingModalOpen, setResolvingModalOpen] = useState<boolean>(false);
  const [createSaleModalOpen, setCreateSaleModalOpen] =
    useState<boolean>(false);
  const [saleIdSelected, setSaleIdSelected] = useState<string | null>(null);

  const resolvingMessages = [
    "Actualizando números de nota de venta...",
    "Ya casi terminamos...",
    "Sincronizando con el servidor...",
    "Verificando integridad de datos...",
    "¡No cierres la ventana!",
  ];

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
    setFilters,
    clearFilters,
    filters,

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
        const numberTemporary =
          await InvoiceNumberService.getTemporaryNumberCount();
        if (numberTemporary === 0) {
          return;
        }
        setResolvingModalOpen(true);
        const response = await InvoiceNumberService.resolveTemporaryNumbers();
        setResolvingModalOpen(false);
        if (response) {
          toast.success(
            "✅ Números de venta temporales resueltos correctamente"
          );
          refresh();
        }
      } catch (err) {
        setResolvingModalOpen(false);
        toast.error(
          "Error resolviendo números de venta temporales, revise la conexión a internet"
        );
      }
    };

    runResolve();
    const onOnline = () => runResolve();
    window.addEventListener("online", onOnline);

    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  useEffect(() => {
    console.log("sales:", sales);
  }, [sales]);

  useEffect(() => {
    console.log("activeSection:", activeSection);
    setPage(0);
    if (activeSection === "ventas") {
      setFilters({ isDraft: false });
    } else if (activeSection === "cotizaciones") {
      setFilters({ isDraft: true });
    }
  }, [activeSection]);
  // Handler para manejar errores
  if (error) {
    if (error.includes("Inicializando base de datos")) {
      return <StartAppText error={error} />;
    }

    return (
      <div className="p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error al cargar ventas</h3>
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
      <ResolvingTemporaryNumbersModal
        open={resolvingModalOpen}
        messages={resolvingMessages}
      />
      <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
        <PageHeader
          title={activeSection === "ventas" ? "Ventas" : "Cotizaciones"}
          subtitle={
            activeSection === "ventas"
              ? "Gestiona las ventas realizadas en el sistema"
              : "Gestiona las cotizaciones realizadas en el sistema"
          }
          icon={<BriefcaseMedical className="w-6 h-6 text-blue-600" />}
        />

        <FilterTabs
          options={[
            { value: "ventas", label: "Ventas" },
            { value: "cotizaciones", label: "Cotizaciones" },
          ]}
          activeFilter={activeSection}
          onFilterChange={setActiveSection}
          className="mb-4"
        />

        {/* Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearch}
            isLoading={loading}
          />
          {/* Select de ordenamiento y filtros con shadcn/ui */}
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">Ordenar por:</span>
            <Select
              value={filters?.orderBy || "createdAt"}
              onValueChange={value => setFilters({ ...filters, orderBy: value as 'createdAt' | 'numberInvoice' })}
              disabled={loading}
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Selecciona orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Fecha de creación</SelectItem>
                <SelectItem value="numberInvoice">Número de factura</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters?.orderDirection || "desc"}
              onValueChange={value => setFilters({ ...filters, orderDirection: value as 'asc' | 'desc' })}
              disabled={loading}
            >
              <SelectTrigger className="w-28 h-9">
                <SelectValue placeholder="Dirección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descendente</SelectItem>
                <SelectItem value="asc">Ascendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {activeSection === "ventas" && (
            <Button
              variant="default"
              onClick={() => {
                setSaleIdSelected(null);
                setCreateSaleModalOpen(true);
              }}
              disabled={loading}
            >
              Nueva venta
            </Button>
          )}
        </div>
        <TableSalesDesktop
          sales={sales}
          loading={loading}
          searchQuery={searchQuery}
          onEdit={(sale) => {
            setSaleIdSelected(sale.id);
            setCreateSaleModalOpen(true);
          }}
          onDelete={(sale) => {
            toast.info("Eliminación de venta próximamente");
          }}
        />

        {/* Tabla Mobile */}
        {activeSection === "ventas" ? (
          <TableSalesMobile
            sales={sales}
            loading={loading}
            searchQuery={searchQuery}
            onEdit={(sale) => {
              toast.info("Edición de venta próximamente");
            }}
            onDelete={(sale) => {
              toast.info("Eliminación de venta próximamente");
            }}
          />
        ) : null}

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
        onClose={() => {
          setSaleIdSelected(null);
          setCreateSaleModalOpen(false);
        }}
        onSaleCreated={refresh}
        initialSaleId={saleIdSelected ?? undefined}
      />
    </>
  );
};
