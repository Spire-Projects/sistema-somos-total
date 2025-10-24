import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Pencil, Trash2, Package } from "lucide-react";
import type { ProductView } from "@/shared/types/modelTypes/Product";
import { memo } from "react";

interface Props {
	products: ProductView[];
	loading: boolean;
	searchQuery: string;
	onEdit: (product: ProductView) => void;
	onDelete: (product: ProductView) => void;
}

const getStockBadge = (stock?: number) => {
	if (!stock || stock === 0) {
		return <Badge variant="destructive">Sin stock</Badge>;
	}
	return <Badge variant="outline" className="border-green-500 text-green-600">Disponible</Badge>;
};

const TableProductMobile = memo(({ products, loading, searchQuery, onEdit, onDelete }: Props) => (
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
								onClick={() => onEdit(product)}
							>
								<Pencil className="h-4 w-4 mr-2" />
								Editar
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onDelete(product)}
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
));

export default TableProductMobile;
