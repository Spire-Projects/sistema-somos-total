import { memo, useState, useCallback, useEffect } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import SearchInput from "@/shared/components/SearchInput";
import { purchaseService } from "@/shared/services/PurchaseService";
import { productService } from "@/shared/services/ProductService";
import type { PurchaseView } from "@/shared/types/modelTypes/PurchaseBox";
import type { ProductView } from "@/shared/types/modelTypes/Product";

interface ProductSearchSectionProps {
  onAddProduct: (purchaseBox: PurchaseView, product: ProductView) => void;
  disabled?: boolean;
}

const ProductSearchSection = memo(({ onAddProduct, disabled = false }: ProductSearchSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PurchaseView[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Buscar productos y lotes usando servicios
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const trimmedQuery = query.trim();

      const productsResponse = await productService.getAllView(1, 100, trimmedQuery);
      const productIds = productsResponse.items.map((p: ProductView) => p.id);
      
      const purchasesByProducts: PurchaseView[] = [];
      for (const productId of productIds) {
        const purchasesForProduct = await purchaseService.getAllView(
          1,
          100,
          '',
          undefined,
          undefined,
          { productId }
        );
        purchasesByProducts.push(
          ...purchasesForProduct.items.filter((p: PurchaseView) => p.quantityAvailable > 0)
        );
      }
      
      // 3. Buscar también por código/recibo directamente en compras
      const directPurchases = await purchaseService.getAllView(1, 100, trimmedQuery);
      
      // 4. Combinar resultados, eliminar duplicados y filtrar solo con stock
      const allPurchases = [
        ...purchasesByProducts, 
        ...directPurchases.items.filter((p: PurchaseView) => p.quantityAvailable > 0)
      ];
      
      const uniquePurchases = allPurchases.reduce((acc: PurchaseView[], current: PurchaseView) => {
        const exists = acc.find((p: PurchaseView) => p.id === current.id);
        if (!exists) acc.push(current);
        return acc;
      }, [] as PurchaseView[]);
      
      // Ordenar por cantidad (menor a mayor para priorizar productos con poco stock)
      uniquePurchases.sort((a: PurchaseView, b: PurchaseView) => 
        a.quantityAvailable - b.quantityAvailable
      );

      setSearchResults(uniquePurchases);
      setShowResults(uniquePurchases.length > 0);
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
  const handleAddProduct = useCallback(async (purchaseView: PurchaseView) => {
    try {
      // El producto ya viene en el PurchaseView
      const product = purchaseView.product;
      
      if (!product) {
        toast.error('No se pudo cargar la información del producto');
        return;
      }

      onAddProduct(purchaseView, product);
      
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
    <div className="relative w-full p-1">
      {/* Buscador */}
      <div className="relative">
       <SearchInput
       
          value={searchQuery}
          onChange={setSearchQuery}
          
          isLoading={isSearching}
          disabled={disabled}
        />
      </div>

      {/* Popover de resultados - z-index alto para aparecer sobre otros elementos */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          <div className="divide-y">
            {searchResults.map((purchase) => (
              <div
                key={purchase.id}
                onClick={() => !disabled && handleAddProduct(purchase)}
                className="p-3 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {purchase.product?.name || purchase.productName || 'Producto sin nombre'}
                      </h4>
                      {(purchase.product?.code || purchase.productCode) && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {purchase.product?.code || purchase.productCode}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Compra:</span> {formatPurchaseDate(purchase.purchaseDate)}
                      </div>
                      <div>
                        <span className="font-medium">Stock:</span>{" "}
                        <span className={purchase.quantityAvailable < 10 ? "text-orange-600 font-medium" : ""}>
                          {purchase.quantityAvailable} und
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
                    {purchase.quantityAvailable < 10 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Stock limitado</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {showResults && searchResults.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="text-center text-gray-500">
            <p className="text-sm">No se encontraron productos con stock disponible</p>
          </div>
        </div>
      )}
    </div>
  );
});

ProductSearchSection.displayName = 'ProductSearchSection';

export default ProductSearchSection;
