import { useState, useEffect, useCallback, memo } from "react";
import { Search, PackageSearch, AlertCircle } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { purchaseService } from "@/shared/services/PurchaseService";
import type { PurchaseBoxForSale } from "../types/sale.types";
import type { PurchaseView } from "@/shared/types/modelTypes/PurchaseBox";

interface ProductSearchProps {
  onProductSelect: (purchaseBox: PurchaseBoxForSale) => void;
  disabled?: boolean;
}

const ProductSearch = memo(({ onProductSelect, disabled = false }: ProductSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PurchaseBoxForSale[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Buscar productos por nombre, código o lote
  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      // Buscar purchaseBoxes con stock > 0
      const result = await purchaseService.getAllView(
        1, 
        20, 
        query.trim(), 
        undefined, 
        undefined,
        undefined
      );

      // Filtrar solo los que tienen stock disponible (quantity > 0)
      const availableBoxes: PurchaseBoxForSale[] = result.items
        .filter((purchase: PurchaseView) => purchase.quantity > 0)
        .map((purchase: PurchaseView) => ({
          ...purchase,
          availableStock: purchase.quantity,
        }));

      setSearchResults(availableBoxes);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Manejar selección de producto
  const handleSelectProduct = useCallback((purchaseBox: PurchaseBoxForSale) => {
    onProductSelect(purchaseBox);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }, [onProductSelect]);

  // Formatear precio
  const formatPrice = (price: number) => {
    return `Bs ${price.toFixed(2)}`;
  };

  // Formatear fecha de vencimiento
  const formatExpirationDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calcular días hasta el vencimiento
  const getDaysToExpiration = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Obtener color del badge según días para vencer
  const getExpirationBadgeVariant = (days: number): "default" | "secondary" | "destructive" | "outline" => {
    if (days < 0) return "destructive"; // Vencido
    if (days <= 30) return "destructive"; // Próximo a vencer
    if (days <= 90) return "secondary"; // Alerta
    return "default"; // Normal
  };

  return (
    <div className="relative w-full">
      {/* Campo de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre o código de barras..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="pl-10 pr-4"
        />
      </div>

      {/* Resultados de búsqueda */}
      {showResults && (
        <Card className="absolute z-50 w-full mt-2 max-h-[400px] overflow-y-auto shadow-lg">
          <CardContent className="p-2">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Buscando...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <PackageSearch className="h-12 w-12 mb-2 text-gray-300" />
                <p className="text-sm font-medium">No se encontraron productos</p>
                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((purchaseBox) => {
                  const daysToExpiration = getDaysToExpiration(purchaseBox.expirationDate);
                  const expirationVariant = getExpirationBadgeVariant(daysToExpiration);

                  return (
                    <Button
                      key={purchaseBox.id}
                      variant="ghost"
                      className="w-full h-auto p-3 justify-start hover:bg-blue-50 transition-colors"
                      onClick={() => handleSelectProduct(purchaseBox)}
                    >
                      <div className="flex flex-col items-start w-full gap-2">
                        {/* Nombre y código del producto */}
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-left">
                              {purchaseBox.productName || 'Producto sin nombre'}
                            </h4>
                            <p className="text-xs text-gray-500 text-left">
                              Código: {purchaseBox.productCode || 'N/A'}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            Stock: {purchaseBox.availableStock}
                          </Badge>
                        </div>

                        {/* Información del lote */}
                        <div className="flex flex-wrap items-center gap-2 w-full text-xs">
                          <Badge variant="secondary">
                            Lote: {purchaseBox.batchCode}
                          </Badge>
                          
                          <Badge variant={expirationVariant}>
                            {daysToExpiration < 0 
                              ? '❌ Vencido' 
                              : daysToExpiration <= 30
                              ? `⚠️ ${daysToExpiration}d`
                              : `📅 ${formatExpirationDate(purchaseBox.expirationDate)}`
                            }
                          </Badge>

                          <Badge variant="default" className="bg-green-600">
                            {formatPrice(purchaseBox.salePrice)}
                          </Badge>
                        </div>

                        {/* Alerta si está próximo a vencer o vencido */}
                        {daysToExpiration <= 30 && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 w-full">
                            <AlertCircle className="h-3 w-3" />
                            <span>
                              {daysToExpiration < 0
                                ? 'Producto vencido - No se recomienda vender'
                                : `Lote próximo a vencer en ${daysToExpiration} días`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

ProductSearch.displayName = "ProductSearch";

export default ProductSearch;
