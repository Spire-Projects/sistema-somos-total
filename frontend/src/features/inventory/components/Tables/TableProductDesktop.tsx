import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
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

const TableProductDesktop = memo(({ products, loading, searchQuery, onEdit, onDelete }: Props) => (
	<Card className="hidden md:block">
		<CardHeader>
			<CardTitle>Lista de Productos</CardTitle>
			<CardDescription>Administra tu inventario de productos</CardDescription>
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
											onClick={() => onEdit(product)}
											>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onDelete(product)}
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
));

export default TableProductDesktop;
