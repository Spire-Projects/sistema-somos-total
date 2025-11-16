import { memo, useState, useEffect } from "react";
import { ShoppingCart, Plus, X, MoreVertical, Download, Upload } from "lucide-react";

import { DataPagination } from "@/shared/components/DataPagination";
import { useEntityData } from "@/shared/hooks";
import { purchaseService } from "@/shared/services/PurchaseService";
import { productService } from "@/shared/services/ProductService";
import { manufacturerService } from "@/shared/services/ManufacturerService";
import type { PurchaseView, PurchaseFilter, PurchaseBox } from "@/shared/types/modelTypes/PurchaseBox";
import type { Product } from "@/shared/types/modelTypes/Product";
import type { Manufacturer } from "@/shared/types/modelTypes/Manufacturer";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";
import CustomDialog from "@/shared/components/CustomDialog";
import TablePurchaseDesktop from "../components/Tables/TablePurchaseDesktop";
import TablePurchaseMobile from "../components/Tables/TablePurchaseMobile";
import { CreatePurchaseModal } from "../components/CreatePurchaseModal";
import { UploadExcelPurchaseModal } from "../components/UploadExcelPurchaseModal";
import StartAppText from "@/shared/components/StartAppText";
import PageHeader from "@/shared/components/PageHeader";
import SearchInput from "@/shared/components/SearchInput";
import { toast } from "sonner";
import type { Subscription } from "rxjs";

const PurchasesPageComponent = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadExcelModalOpen, setIsUploadExcelModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseView | null>(null);
  const [purchaseToEdit, setPurchaseToEdit] = useState<PurchaseView | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>("");

  // Cargar productos y proveedores para filtros
  useEffect(() => {
    let productSubscription: Subscription | undefined;
    let manufacturerSubscription: Subscription | undefined;

    if (productService.listen$) {
      productSubscription = productService.listen$(1, 100).subscribe({
        next: (items) => setProducts(items),
        error: (err) => console.error('Error loading products:', err),
      });
    } else {
      productService.getAllView(1, 100)
        .then(response => setProducts(response.items))
        .catch(error => console.error('Error loading products:', error));
    }

    if (manufacturerService.listen$) {
      manufacturerSubscription = manufacturerService.listen$(1, 100).subscribe({
        next: (items) => setManufacturers(items),
        error: (err) => console.error('Error loading manufacturers:', err),
      });
    } else {
      manufacturerService.getAllView(1, 100)
        .then(response => setManufacturers(response.items))
        .catch(error => console.error('Error loading manufacturers:', error));
    }

    return () => {
      if (productSubscription) productSubscription.unsubscribe();
      if (manufacturerSubscription) manufacturerSubscription.unsubscribe();
    };
  }, []);

  const {
    // Data
    items: purchases,
    loading,
    error,

    // Pagination
    currentPage,
    pageSize,
    totalItems,
    totalPages,

    // Search & Filters
    searchQuery,
    filters,

    // Actions - Pagination
    setPage,
    setPageSize,

    // Actions - Search & Filters
    setSearch,
    setFilters,
    clearFilters,

    // Actions - General
    refresh,
  } = useEntityData<PurchaseBox, PurchaseView, PurchaseFilter>(purchaseService, {
    initialPageSize: 10,
    enableRealtime: true,
  });

  const handlePurchaseCreated = async () => {
    setIsCreateModalOpen(false);
    setPurchaseToEdit(null);
  };

  // Handler para manejar éxito de importación
  const handleImportSuccess = async () => {
    setIsUploadExcelModalOpen(false);
    await refresh();
  };

  // Handler para cambiar filtro de producto
  const handleProductFilterChange = (productId: string) => {
    setSelectedProductId(productId);
    if (productId === "all") {
      const newFilters = { ...filters };
      delete newFilters.productId;
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, productId });
    }
  };

  // Handler para cambiar filtro de proveedor
  const handleManufacturerFilterChange = (manufacturerId: string) => {
    setSelectedManufacturerId(manufacturerId);
    if (manufacturerId === "all") {
      const newFilters = { ...filters };
      delete newFilters.supplierId;
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, supplierId: manufacturerId });
    }
  };

  // Handler para limpiar filtros
  const handleClearFilters = () => {
    setSelectedProductId("all");
    setSelectedManufacturerId("all");
    setSearch(""); // Limpiar búsqueda
    clearFilters();
  };

  // Handler para eliminar compra
  const handleDeleteClick = (purchase: PurchaseView) => {
    setPurchaseToDelete(purchase);
    setDeleteDialogOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!purchaseToDelete) return;

    try {
      await purchaseService.delete(purchaseToDelete.id);
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
      await refresh();
      toast.success("Compra eliminada exitosamente");
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error("Error al eliminar la compra. Intenta nuevamente");
    }
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setPurchaseToDelete(null);
  };

  // Manejo de errores
  if (error) {
    if (error.includes("Inicializando base de datos")) {
      return <StartAppText error={error} />;
    }

    return (
      <div className="p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">
            Error al cargar compras
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
    <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Compra de Productos"
        subtitle="Gestiona las compras de productos"
        icon={<ShoppingCart />}
        classNameIcon="text-blue-600"
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearch}
          isLoading={loading}
        />

        {/* Filtro por Producto */}
        <Select
          value={selectedProductId}
          onValueChange={handleProductFilterChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los productos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Proveedor */}
        <Select
          value={selectedManufacturerId}
          onValueChange={handleManufacturerFilterChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los proveedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {manufacturers.map((manufacturer) => (
              <SelectItem key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setPurchaseToEdit(null);
            setIsCreateModalOpen(true);
          }}
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Compra
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={loading} aria-label="Más opciones">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => toast.info("Exportación pendiente de implementar")}
            >
              <Download className="h-4 w-4 mr-2" /> Exportar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsUploadExcelModalOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" /> Importar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Botón limpiar filtros */}
      {Object.keys(filters).length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Limpiar filtros
        </Button>
      )}

      {/* Table - Desktop */}
      <TablePurchaseDesktop
        purchases={purchases}
        loading={loading}
        searchQuery={searchQuery}
        onEdit={(purchase) => {
          setPurchaseToEdit(purchase);
          setIsCreateModalOpen(true);
        }}
        onDelete={handleDeleteClick}
      />

      {/* Mobile View */}
      <TablePurchaseMobile
        purchases={purchases}
        loading={loading}
        searchQuery={searchQuery}
        onEdit={(purchase) => {
          setPurchaseToEdit(purchase);
          setIsCreateModalOpen(true);
        }}
        onDelete={handleDeleteClick}
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
            itemName="compras"
          />
        </div>
      )}

      {/* Modal de Creación/Edición de Compra */}
      <CreatePurchaseModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPurchaseToEdit(null);
        }}
        onSuccess={handlePurchaseCreated}
        createdBy="current-user" // TODO: Obtener del contexto de autenticación
        purchaseToEdit={purchaseToEdit}
      />

      {/* Dialog de Confirmación de Eliminación */}
      <CustomDialog
        isOpen={deleteDialogOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={loading}
        title="¿Eliminar compra?"
        description={`¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer.`}
        textConfirm="Eliminar"
        textCancel="Cancelar"
      />

      {/* Modal de Importación desde Excel */}
      <UploadExcelPurchaseModal
        isOpen={isUploadExcelModalOpen}
        onClose={() => setIsUploadExcelModalOpen(false)}
        onSuccess={handleImportSuccess}
        createdBy="current-user" // TODO: Obtener del contexto de autenticación
      />
    </div>
  );
};

PurchasesPageComponent.displayName = 'PurchasesPage';

export const PurchasesPage = memo(PurchasesPageComponent);
