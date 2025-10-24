import { memo, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Search, Package, Plus, AlertCircle } from "lucide-react";
import { getPurchaseBoxRepository } from "@/shared/db/repositories/purchase.repository";
import { getProductRepository } from "@/shared/db/repositories/product.repository";
import type { PurchaseBox } from "@/shared/types/modelTypes/PurchaseBox";
import type { Product } from "@/shared/types/modelTypes/Product";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SearchInput from "@/shared/components/SearchInput";

interface PurchaseBoxWithProduct extends PurchaseBox {
  productName?: string;
  productCode?: string;
}

interface ProductSearchSectionProps {
  onAddProduct: (purchaseBox: PurchaseBoxWithProduct, product: Product) => void;
  disabled?: boolean;
}

const ProductSearchSection = memo(({ onAddProduct, disabled = false }: ProductSearchSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PurchaseBoxWithProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Buscar productos y lotes
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const purchaseRepo = getPurchaseBoxRepository();
      const productRepo = getProductRepository();

      // Buscar purchases con stock > 0
      const allPurchases = await purchaseRepo.getAll(1, 100, query);
      
      // Filtrar solo los que tienen stock
      const purchasesWithStock = allPurchases.items.filter(p => p.quantity > 0);

      // Enriquecer con información del producto
      const enrichedResults: PurchaseBoxWithProduct[] = await Promise.all(
        purchasesWithStock.map(async (purchase) => {
          try {
            const product = await productRepo.findById(purchase.productId);
            return {
              ...purchase,
              productName: product?.name,
              productCode: product?.code,
            };
          } catch (error) {
            console.error('Error loading product info:', error);
            return {
              ...purchase,
              productName: 'Producto desconocido',
              productCode: undefined,
            };
          }
        })
      );

      setSearchResults(enrichedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Error al buscar productos');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Manejar agregar producto
  const handleAddProduct = useCallback(async (purchaseBox: PurchaseBoxWithProduct) => {
    try {
      const productRepo = getProductRepository();
      const product = await productRepo.findById(purchaseBox.productId);
      
      if (!product) {
        toast.error('No se pudo cargar la información del producto');
        return;
      }

      onAddProduct(purchaseBox, product);
      
      // Limpiar búsqueda después de agregar
      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error al agregar el producto');
    }
  }, [onAddProduct]);

  // Formatear fecha de expiración
  const formatPurchaseDate = (date?: string) => {
    if (!date) return 'Sin fecha';
    const purchaseDate = new Date(date);
    return <span className="text-gray-600">{purchaseDate.toLocaleDateString()}</span>;
  };

  // Calcular precio de venta
  const calculateSellingPrice = (unitCost: number, profitMargin?: number) => {
    const margin = profitMargin || 0;
    return unitCost * (1 + margin / 100);
  };

  return (
    <Card className="!gap-2">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Buscar Productos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Buscador */}
        <div className="relative">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              disabled={disabled}
              isLoading={isSearching}
            />
        
        </div>

        {/* Resultados de búsqueda */}
        {showResults && searchResults.length > 0 && (
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            <div className="divide-y">
              {searchResults.map((purchase) => (
                <div
                  key={purchase.id}
                  className="p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {purchase.productName || 'Producto sin nombre'}
                        </h4>
                        {purchase.productCode && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {purchase.productCode}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Compra:</span> {formatPurchaseDate(purchase.purchaseDate)}
                        </div>
                        <div>
                          <span className="font-medium">Stock:</span>{" "}
                          <span className={purchase.quantity < 10 ? "text-orange-600 font-medium" : ""}>
                            {purchase.quantity} und
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Costo:</span> Bs {purchase.unitCost.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Precio Venta:</span> Bs {calculateSellingPrice(purchase.unitCost, purchase.profitMarginPercentage).toFixed(2)}
                        </div>
                        {purchase.receiptNumber && (
                          <div className="col-span-2">
                            <span className="font-medium">Recibo:</span> {purchase.receiptNumber}
                          </div>
                        )}
                      </div>

                      {/* Alertas */}
                      {purchase.quantity < 10 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Stock limitado</span>
                        </div>
                      )}
                    </div>

                    {/* Botón agregar */}
                    <Button
                      size="sm"
                      onClick={() => handleAddProduct(purchase)}
                      disabled={disabled}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {showResults && searchResults.length === 0 && !isSearching && (
          <div className="text-center pt-2 text-gray-500">
           
            <p className="text-sm">No se encontraron productos con stock disponible</p>
          </div>
        )}

       
      </CardContent>
    </Card>
  );
});

ProductSearchSection.displayName = 'ProductSearchSection';

export default ProductSearchSection;
