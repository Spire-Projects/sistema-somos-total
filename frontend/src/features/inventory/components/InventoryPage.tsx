import { memo, useState } from "react";
import { Package, Download, Search, X, Plus } from "lucide-react";
import { DataPagination } from "@/shared/components/DataPagination";
import { useEntityData } from "@/shared/hooks";
import { productService } from "@/shared/services/ProductService";
import type { ProductView, ProductFilter, Product } from "@/shared/types/modelTypes/Product";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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

const InventoryPageComponent = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    clearFilters,

    // Actions - General
    refresh,
  } = useEntityData<Product, ProductView, ProductFilter>(productService, {
    initialPageSize: 10,
    enableRealtime: true,
  });

  const handleProductCreated = async () => {
    setIsCreateModalOpen(false);
    //await refresh();
  };

  // Helper para determinar badge de stock
  const getStockBadge = (stock?: number) => {
    if (!stock || stock === 0) {
      return <Badge variant="destructive">Sin stock</Badge>;
    }
    if (stock < 10) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Stock bajo</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-600">Disponible</Badge>;
  };

  if (error) {
    // Si es error de inicialización, mostrar estado de carga
    if (error.includes("Inicializando base de datos")) {
      return (
        <div className="p-4 lg:p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <h3 className="text-blue-800 font-medium">
                Inicializando aplicación
              </h3>
            </div>
            <p className="text-blue-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      );
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg self-center mt-1">
            <Package className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Inventario
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Gestión de productos y control de stock
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por código, nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            className="pl-10"
          />
        </div>

        {/* TODO: Agregar filtros por categoría cuando esté implementado */}
        {Object.keys(filters).length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
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
              {searchQuery && ` para "${searchQuery}"`}
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
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
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
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Ver detalles
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      <div>
        {totalItems} productos encontrados
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

      {/* Modal de Creación de Producto */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProductCreated}
        createdBy="current-user" // TODO: Obtener del contexto de autenticación
      />
    </div>
  );
};

export const InventoryPage = memo(InventoryPageComponent);
