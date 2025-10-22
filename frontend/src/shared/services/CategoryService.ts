import { BaseService } from './BaseService';
import type { Category, CreateCategoryData, UpdateCategoryData } from '../types/modelTypes/Category';
import { getCategoryRepository, type CategoryFilter } from '../db/repositories/category.repository';

// CategoryView es igual a Category, no necesita campos adicionales
export type CategoryView = Category;

class CategoryService extends BaseService<Category, CategoryView, CreateCategoryData, UpdateCategoryData, CategoryFilter> {
  constructor() {
    super(getCategoryRepository());
  }

  protected async toView(entity: Category): Promise<CategoryView> {
    // No necesitamos transformación adicional para categorías
    return entity;
  }
}

export const categoryService = new CategoryService();
