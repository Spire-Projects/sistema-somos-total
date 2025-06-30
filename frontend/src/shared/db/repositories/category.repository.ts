import type { MedicationCategory } from '../../types/Medication';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';

export interface IMedicationCategoryRepository {
  create(categoryData: Omit<MedicationCategory, 'id'>): Promise<MedicationCategory>;
  findByName(name: string): Promise<MedicationCategory | null>;
  findById(id: string): Promise<MedicationCategory | null>;
  findAll(): Promise<MedicationCategory[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<MedicationCategory>>;
  update(id: string, updateData: Partial<MedicationCategory>): Promise<MedicationCategory | null>;
  delete(id: string): Promise<boolean>;
  search(searchText: string): Promise<MedicationCategory[]>;
}

export class LocalMedicationCategoryRepository implements IMedicationCategoryRepository {
  async create(categoryData: Omit<MedicationCategory, 'id'>): Promise<MedicationCategory> {
    const db = await initDatabase();
    const id = crypto.randomUUID();
    const category = await db.medication_categories.insert({ id, ...categoryData });
    return category.toJSON();
  }

  async findByName(name: string): Promise<MedicationCategory | null> {
    const db = await initDatabase();
    const category = await db.medication_categories.findOne({ selector: { name } }).exec();
    return category ? category.toJSON() : null;
  }

  async findById(id: string): Promise<MedicationCategory | null> {
    const db = await initDatabase();
    const category = await db.medication_categories.findOne(id).exec();
    return category ? category.toJSON() : null;
  }

  async findAll(): Promise<MedicationCategory[]> {
    const db = await initDatabase();
    const categories = await db.medication_categories.find().exec();
    return categories.map((category) => category.toJSON());
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<MedicationCategory>> {
    const db = await initDatabase();
    
    let query;
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      query = db.medication_categories.find({
        selector: {
          $or: [
            { name: { $regex: normalizedText, $options: 'i' } },
            { description: { $regex: normalizedText, $options: 'i' } }
          ]
        }
      });
    } else {
      query = db.medication_categories.find();
    }

    // Obtener todos los resultados para calcular el total
    const allCategories = await query.exec();
    const totalItems = allCategories.length;
    const totalPages = Math.ceil(totalItems / size);

    // Aplicar paginación
    const skip = (page - 1) * size;
    const paginatedCategories = allCategories
      .slice(skip, skip + size)
      .map((category) => category.toJSON());

    return {
      items: paginatedCategories,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async update(id: string, updateData: Partial<MedicationCategory>): Promise<MedicationCategory | null> {
    const db = await initDatabase();
    const category = await db.medication_categories.findOne(id).exec();
    if (!category) return null;
    await category.update({ $set: updateData });
    return category.toJSON();
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const category = await db.medication_categories.findOne(id).exec();
    if (!category) return false;
    await category.remove();
    return true;
  }

  async search(searchText: string): Promise<MedicationCategory[]> {
    if (!searchText || searchText.trim() === "") {
      return this.findAll();
    }
    const db = await initDatabase();
    const normalizedText = searchText.trim().toLowerCase();
    const allCategories = await db.medication_categories.find().exec();
    const filteredCategories = allCategories.filter((category) => {
      const categoryJson = category.toJSON();
      return (
        categoryJson.name.toLowerCase().includes(normalizedText) ||
        (categoryJson.description && categoryJson.description.toLowerCase().includes(normalizedText))
      );
    });
    return filteredCategories.map((category) => category.toJSON());
  }
}

export class FirestoreMedicationCategoryRepository implements IMedicationCategoryRepository {
  async create(_categoryData: Omit<MedicationCategory, 'id'>): Promise<MedicationCategory> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByName(_name: string): Promise<MedicationCategory | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<MedicationCategory | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<MedicationCategory[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<MedicationCategory>> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<MedicationCategory>): Promise<MedicationCategory | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async search(_searchText: string): Promise<MedicationCategory[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localMedicationCategoryRepository = new LocalMedicationCategoryRepository();
export const firestoreMedicationCategoryRepository = new FirestoreMedicationCategoryRepository();

export const getMedicationCategoryRepository = (): IMedicationCategoryRepository => {
  return config.APP_MODE === 'local' ? localMedicationCategoryRepository : firestoreMedicationCategoryRepository;
};