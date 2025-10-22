import { BaseService } from './BaseService';
import type { Product, ProductView, CreateProductData, UpdateProductData, ProductFilter } from '../types/modelTypes/Product';
import { getProductRepository } from '../db/repositories/product.repository';

class ProductService extends BaseService<Product, ProductView, CreateProductData, UpdateProductData, ProductFilter> {
  constructor() {
    super(getProductRepository());
  }

  protected async toView(entity: Product): Promise<ProductView> {
    return {
      ...entity,
      categoryName: entity.category,
      stock: 12
    };
  }
}

export const productService = new ProductService();