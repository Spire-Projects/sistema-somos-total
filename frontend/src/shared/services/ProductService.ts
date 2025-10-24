import { BaseService } from './BaseService';
import type { Product, ProductView, CreateProductData, UpdateProductData, ProductFilter } from '../types/modelTypes/Product';
import { getProductRepository } from '../db/repositories/product.repository';
import { getCategoryRepository } from '../db/repositories/category.repository';

class ProductService extends BaseService<Product, ProductView, CreateProductData, UpdateProductData, ProductFilter> {
  constructor() {
    super(getProductRepository());
  }

  protected async toView(entity: Product): Promise<ProductView> {
    let categoryName: string | undefined = undefined;
    // Resolver nombre de categoría si existe el ID
    if (entity.category) {
      try {
        const categoryRepo = getCategoryRepository();
        const category = await categoryRepo.findById(entity.category);
        categoryName = category?.name;
      } catch (error) {
        console.error('Error resolving category name:', error);
      }
    }

    // Calcular stock sumando las cantidades de purchases de este producto
    let stock = 0;
    try {
      // Importación dinámica para evitar dependencias circulares
      const { purchaseService } = await import('./PurchaseService');
      // Traer todas las compras de este producto (sin paginación)
      const result = await purchaseService.getAllView(1, 1000, undefined, undefined, undefined, { productId: entity.id });
      stock = result.items.reduce((acc: number, purchase: any) => acc + (purchase.quantity || 0), 0);
    } catch (error) {
      console.error('Error calculating stock from purchases:', error);
    }

    return {
      ...entity,
      categoryName,
      stock
    };
  }
}

export const productService = new ProductService();