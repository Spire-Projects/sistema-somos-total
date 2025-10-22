import { memo, useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Package, AlertCircle } from 'lucide-react';
import type { Product } from '@/shared/types/modelTypes/Product';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

interface ProductTableProps {
  products: Product[];
  loading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onRowClick?: (product: Product) => void;
}

/**
 * Formatea un número como moneda
 */
const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Determina el estado del stock y retorna badge apropiado
 */
const StockBadge = memo(({ stock }: { stock?: number }) => {
  if (stock === undefined || stock === null) {
    return <Badge variant="outline">Sin stock</Badge>;
  }

  if (stock === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Agotado
      </Badge>
    );
  }

  if (stock < 10) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 bg-yellow-50">
              <AlertCircle className="h-3 w-3" />
              Bajo
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stock bajo: {stock} unidades</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (stock < 50) {
    return (
      <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
        Normal
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
      Óptimo
    </Badge>
  );
});

StockBadge.displayName = 'StockBadge';

/**
 * Skeleton para la tabla mientras carga
 */
const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-full max-w-xs" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-md" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

/**
 * Fila vacía cuando no hay productos
 */
const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={7} className="h-32 text-center">
      <div className="flex flex-col items-center justify-center text-muted-foreground">
        <Package className="h-12 w-12 mb-2 opacity-20" />
        <p className="text-sm font-medium">No se encontraron productos</p>
        <p className="text-xs mt-1">Intenta ajustar los filtros o la búsqueda</p>
      </div>
    </TableCell>
  </TableRow>
);

/**
 * Componente de tabla de productos con todas las funcionalidades
 */
const ProductTableComponent = ({
  products,
  loading = false,
  onEdit,
  onDelete,
  onRowClick,
}: ProductTableProps) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleRowClick = (product: Product, event: React.MouseEvent) => {
    // No activar click si se hizo clic en el menú de acciones
    if ((event.target as HTMLElement).closest('[data-action-menu]')) {
      return;
    }
    onRowClick?.(product);
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px] font-semibold">Código</TableHead>
            <TableHead className="font-semibold">Producto</TableHead>
            <TableHead className="font-semibold">Categoría</TableHead>
            <TableHead className="w-[120px] font-semibold">Stock</TableHead>
            <TableHead className="w-[120px] font-semibold text-right">Costo</TableHead>
            <TableHead className="w-[120px] font-semibold text-right">Precio</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton />
          ) : products.length === 0 ? (
            <EmptyState />
          ) : (
            products.map((product) => (
              <TableRow
                key={product.code}
                className={`cursor-pointer transition-colors ${
                  hoveredRow === product.code ? 'bg-muted/50' : ''
                }`}
                onMouseEnter={() => setHoveredRow(product.code)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={(e) => handleRowClick(product, e)}
              >
                <TableCell className="font-mono text-sm font-medium">
                  {product.code}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{product.name}</span>
                    {product.category && (
                      <span className="text-xs text-muted-foreground">
                        {product.category}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {product.category ? (
                    <Badge variant="secondary" className="font-normal">
                      {product.category}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin categoría</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">
                      {product.stock ?? 0}
                    </span>
                    <StockBadge stock={product.stock} />
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(product.unitCost)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatCurrency(product.unitPrice)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        data-action-menu
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onEdit && (
                        <DropdownMenuItem
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onEdit(product);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onDelete(product);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

ProductTableComponent.displayName = 'ProductTable';

export const ProductTable = memo(ProductTableComponent);
