import { BaseService } from './BaseService';
import type { Product, ProductView, CreateProductData, UpdateProductData, ProductFilter } from '../types/modelTypes/Product';
import { getProductRepository } from '../db/repositories/product.repository';
import { categoryService } from './CategoryService';

class ProductService extends BaseService<Product, ProductView, CreateProductData, UpdateProductData, ProductFilter> {
  constructor() {
    super(getProductRepository());
  }

  protected async toView(entity: Product): Promise<ProductView> {
    let categoryName: string | undefined = undefined;

    if (entity.category) {
      try {
        const category = await categoryService.findById(entity.category);
        categoryName = category?.name;
      } catch (error) {
        console.error('Error resolving category name:', error);
      }
    }

    // Calcular stock directamente desde el repositorio para evitar ciclo infinito
    let stock = 0;
    try {
      const { getPurchaseBoxRepository } = await import('../db/repositories/purchase.repository');
      const purchaseRepo = getPurchaseBoxRepository();
      const result = await purchaseRepo.getAll(1, 1000, undefined, undefined, undefined, { productId: entity.id });
      stock = result.items.reduce((acc: number, purchase: any) => acc + (purchase.quantityAvailable || 0), 0);
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