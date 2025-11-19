
import { memo, useState, useEffect } from "react";
import { Package, Download, X, Plus, MoreVertical } from "lucide-react";

import { DataPagination } from "@/shared/components/DataPagination";
import { useEntityData } from "@/shared/hooks";
import { productService } from "@/shared/services/ProductService";
import { categoryService } from "@/shared/services/CategoryService";
import type { ProductView, ProductFilter, Product } from "@/shared/types/modelTypes/Product";
import type { Category } from "@/shared/types/modelTypes/Category";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import CustomDialog from "@/shared/components/CustomDialog";

import StartAppText from "@/shared/components/StartAppText";
import PageHeader from "@/shared/components/PageHeader";
import SearchInput from "@/shared/components/SearchInput";
import { toast } from "sonner"
import type { Subscription } from "rxjs";
import { Button } from "@/shared/components/ui/button";
import TableProductDesktop from "../components/Tables/TableProductDesktop";
import TableProductMobile from "../components/Tables/TableProductMobile";
import { CreateProductModal } from "../components/CreateProductModal";
import { excelExportService } from "@/shared/services/ExcelExportService";
import useGlobalStates from "@/shared/hooks/useGlobalStates";


const InventoryPageComponent = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductView | null>(null);
  const [productToEdit, setProductToEdit] = useState<ProductView | null>(null);

  useEffect(() => {
    let subscription: Subscription | undefined;
    if (categoryService.listen$) {
      subscription = categoryService.listen$(1, 100).subscribe({
        next: (items) => setCategories(items),
        error: (err) => console.error('Error loading categories:', err),
      });
    } else {
      // fallback: carga una vez
      categoryService.getAllView(1, 100)
        .then(response => setCategories(response.items))
        .catch(error => console.error('Error loading categories:', error));
    }
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const {
    // Data
    items: products,
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
  } = useEntityData<Product, ProductView, ProductFilter>(productService, {
    initialPageSize: 10,
    enableRealtime: true,
  });

  const handleProductCreated = async () => {
    setIsCreateModalOpen(false);
    setProductToEdit(null);
  };

  // Handler para cambiar filtro de categoría
  const handleCategoryFilterChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    if (categoryId === "all") {
      setFilters({});
    } else {
      setFilters({ category: categoryId });
    }
  };

  // Handler para limpiar filtros (sobrescribe clearFilters del hook)
  const handleClearFilters = () => {
    setSelectedCategoryId("all");
    setSearch(""); // Limpiar búsqueda
    clearFilters();
  };

  // Handler para eliminar producto
  const handleDeleteClick = (product: ProductView) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await productService.delete(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      await refresh();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("Error al eliminar el producto. Intenta nuevamente")
    }
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const {user} = useGlobalStates();
 
  const handleExportTable = async () => {
   
    toast.info("Generando reporte de productos...");
    const allProducts = await productService.getAllView(1, 10000);

    await excelExportService.exportToExcel(allProducts.items, {
      title: 'Reporte de Productos',
      fileName: 'reporte_productos',
      exportedBy: user?.fullName || user?.email || 'Desconocido', // TODO: Reemplazar con el nombre del usuario autenticado
      sheetName: 'Productos',
      columnMapping: {
        name: 'Nombre',
        categoryName: 'Categoría',
        stock: 'Stock',
       
        createdAt: 'Fecha de Creación',
      },
      excludeColumns: ['_lastModifiedAt'],
    });
    toast.success("Reporte de productos generado exitosamente");
  }



  if (error) {

    if (error.includes("Inicializando base de datos")) {
      return <StartAppText error={error} />;
    }

    return (
      <div className="p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">
            Error al cargar productos
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
        title="Inventario"
        subtitle="Gestiona los productos de tu inventario"
        icon={<Package />}
        classNameIcon="text-blue-600"
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearch}
          isLoading={loading}
        />

        {/* Filtro por Categoría */}
        <Select
          value={selectedCategoryId}
          onValueChange={handleCategoryFilterChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>




        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setProductToEdit(null);
            setIsCreateModalOpen(true);
          }}
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={loading} aria-label="Más opciones">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleExportTable()}
            >
              <Download className="h-4 w-4 mr-2" /> Exportar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>


      </div>
      
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


      {/* El botón de exportar ahora está en el menú de 3 puntos */}
      


      {/* Table - Desktop */}
      <TableProductDesktop
        products={products}
        loading={loading}
        searchQuery={searchQuery}
        onEdit={(product) => {
          setProductToEdit(product);
          setIsCreateModalOpen(true);
        }}
        onDelete={handleDeleteClick}
      />


      {/* Mobile View */}
      <TableProductMobile
        products={products}
        loading={loading}
        searchQuery={searchQuery}
        onEdit={(product) => {
          setProductToEdit(product);
          setIsCreateModalOpen(true);
        }}
        onDelete={handleDeleteClick}
      />


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
            itemName="productos"
          />
        </div>
      )}

      {/* Modal de Creación/Edición de Producto */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setProductToEdit(null);
        }}
        onSuccess={handleProductCreated}
        createdBy={user?.id || "current-user"}
        productToEdit={productToEdit}
      />



      {/* Dialog de Confirmación de Eliminación */}
      <CustomDialog
        isOpen={deleteDialogOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={loading}
        title="¿Eliminar producto?"
        description={`¿Estás seguro de que deseas eliminar el producto "${productToDelete?.name ?? ''}"? Esta acción no se puede deshacer.`}
        textConfirm="Eliminar"
        textCancel="Cancelar"
      />
    </div>
  );
};

export const InventoryPage = memo(InventoryPageComponent);
