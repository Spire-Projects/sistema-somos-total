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
    
    return {
      ...entity,
      categoryName,
      stock: 12 // TODO: Calcular stock real desde PurchaseBox
    };
  }
}

export const productService = new ProductService();