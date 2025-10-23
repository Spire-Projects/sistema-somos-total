import { memo, useState, useEffect, useCallback } from "react";
import { Package, Download, Search, X, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useDebounce } from "@/shared/hooks";
import { DataPagination } from "@/shared/components/DataPagination";
import { useEntityData } from "@/shared/hooks";
import { productService } from "@/shared/services/ProductService";
import { categoryService } from "@/shared/services/CategoryService";
import type { ProductView, ProductFilter, Product } from "@/shared/types/modelTypes/Product";
import type { Category } from "@/shared/types/modelTypes/Category";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { CreateProductModal } from "./CreateProductModal";
import StartAppText from "@/shared/components/StartAppText";
import PageHeader from "@/shared/components/PageHeader";

// Componente SearchInput memoizado para evitar re-renders y pérdida de foco
const SearchInput = memo(({
  value,
  onChange,
  disabled = false,
  isLoading = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}) => {
  return (
    <div className="relative flex-1">
      {isLoading ? (
        <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      )}
      <Input
        type="text"
        placeholder="Buscar por código, nombre o descripción..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-busy={isLoading}
        className="pl-10"
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

const InventoryPageComponent = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductView | null>(null);
  const [productToEdit, setProductToEdit] = useState<ProductView | null>(null);
  
  // Estado local para el input de búsqueda (evita perder foco)
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  
  // Debounce del search local antes de enviarlo al hook
  const debouncedLocalSearch = useDebounce(localSearchQuery, 300);

  // Cargar categorías al montar el componente
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getAllView(1, 100); // Cargar todas las categorías
        setCategories(response.items);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
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

  // Sincronizar el debounced local search con el hook de búsqueda
  useEffect(() => {
    if (debouncedLocalSearch !== searchQuery) {
      setSearch(debouncedLocalSearch);
    }
  }, [debouncedLocalSearch, setSearch]);

  // Handler para cambiar búsqueda local (memoizado)
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
  }, []);

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
    setLocalSearchQuery(""); // Limpiar búsqueda local también
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
      // TODO: Mostrar toast de error
    }
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // Helper para determinar badge de stock
  const getStockBadge = (stock?: number) => {
    if (!stock || stock === 0) {
      return <Badge variant="destructive">Sin stock</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-600">Disponible</Badge>;
  };

  if (error) {
    // Si es error de inicialización, mostrar estado de carga
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
          value={localSearchQuery}
          onChange={handleSearchChange}
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => console.log('TODO: Implementar exportación')}
          disabled={loading}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {loading ? (
            <span>Cargando productos...</span>
          ) : (
            <span>
              Mostrando {products.length} de {totalItems} productos
              {localSearchQuery && ` para "${localSearchQuery}"`}
            </span>
          )}
        </div>
        {!loading && totalItems > 0 && (
          <div>
            Página {currentPage} de {totalPages}
          </div>
        )}
      </div>

      {/* Table - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>
            Administra tu inventario de productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando productos...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay productos</p>
              <p className="text-sm">
                {searchQuery
                  ? "No se encontraron productos con ese criterio de búsqueda"
                  : "Comienza agregando tu primer producto"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.categoryName ? (
                        <Badge variant="secondary">{product.categoryName}</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{product.stock ?? 0}</span>
                    </TableCell>
                    <TableCell>{getStockBadge(product.stock)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setProductToEdit(product);
                            setIsCreateModalOpen(true);
                          }}
                          disabled={loading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(product)}
                          disabled={loading}
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
          )}
        </CardContent>
      </Card>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando productos...</span>
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">No hay productos</p>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? "No se encontraron productos"
                  : "Comienza agregando tu primer producto"}
              </p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Código: {product.code}
                    </CardDescription>
                  </div>
                  {getStockBadge(product.stock)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.categoryName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Categoría:</span>
                    <Badge variant="secondary">{product.categoryName}</Badge>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Stock:</span>
                  <span className="font-semibold">{product.stock ?? 0}</span>
                </div>
                {product.description && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {product.description}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setProductToEdit(product);
                      setIsCreateModalOpen(true);
                    }}
                    disabled={loading}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(product)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>


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
        createdBy="current-user" // TODO: Obtener del contexto de autenticación
        productToEdit={productToEdit}
      />

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{productToDelete?.name}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const InventoryPage = memo(InventoryPageComponent);
