import type { MedicationCategory } from '../../types/Medication';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';

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

export class LocalMedicationCategoryRepository extends BaseRepository<MedicationCategory> implements IMedicationCategoryRepository {
  
  protected async getCollection(): Promise<RxCollection<MedicationCategory>> {
    const db = await initDatabase();
    return db.medication_categories;
  }

  async create(categoryData: Omit<MedicationCategory, 'id'>): Promise<MedicationCategory> {
    const id = crypto.randomUUID();
    const fullData = { id, ...categoryData } as MedicationCategory;
    console.log(`🔄 MedicationCategoryRepository: Creando categoría con prioridad`, { id });
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<MedicationCategory>): Promise<MedicationCategory | null> {
    console.log(`🔄 MedicationCategoryRepository: Actualizando categoría ${id} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar categoría ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ MedicationCategoryRepository: Eliminando categoría ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<MedicationCategory | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<MedicationCategory[]> {
    return await super.findAll();
  }

  async findByName(name: string): Promise<MedicationCategory | null> {
    const db = await initDatabase();
    const category = await db.medication_categories.findOne({ 
      selector: { name }
    }).exec();
    return category ? JSON.parse(JSON.stringify(category.toJSON())) as MedicationCategory : null;
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

  // Métodos originales comentados para evitar conflictos con BaseRepository
  /*
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
  */

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