import type { ActiveIngredient } from '../../types/Medication';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';

export interface IActiveIngredientRepository {
  create(ingredientData: Omit<ActiveIngredient, 'id'>): Promise<ActiveIngredient>;
  findByName(name: string): Promise<ActiveIngredient | null>;
  findById(id: string): Promise<ActiveIngredient | null>;
  findAll(): Promise<ActiveIngredient[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<ActiveIngredient>>;
  update(id: string, updateData: Partial<ActiveIngredient>): Promise<ActiveIngredient | null>;
  delete(id: string): Promise<boolean>;
  search(searchText: string): Promise<ActiveIngredient[]>;
}

export class LocalActiveIngredientRepository extends BaseRepository<ActiveIngredient> implements IActiveIngredientRepository {
  
  protected async getCollection(): Promise<RxCollection<ActiveIngredient>> {
    const db = await initDatabase();
    return db.active_ingredients;
  }

  async create(ingredientData: Omit<ActiveIngredient, 'id'>): Promise<ActiveIngredient> {
    const id = crypto.randomUUID();
    const fullData = { id, ...ingredientData } as ActiveIngredient;
    console.log(`🔄 ActiveIngredientRepository: Creando principio activo con prioridad`, { id });
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<ActiveIngredient>): Promise<ActiveIngredient | null> {
    console.log(`🔄 ActiveIngredientRepository: Actualizando principio activo ${id} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar principio activo ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ ActiveIngredientRepository: Eliminando principio activo ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<ActiveIngredient | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<ActiveIngredient[]> {
    return await super.findAll();
  }

  async findByName(name: string): Promise<ActiveIngredient | null> {
    const db = await initDatabase();
    const ingredient = await db.active_ingredients.findOne({ 
      selector: { name }
    }).exec();
    return ingredient ? JSON.parse(JSON.stringify(ingredient.toJSON())) as ActiveIngredient : null;
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<ActiveIngredient>> {
    const db = await initDatabase();
    
    let query;
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      query = db.active_ingredients.find({
        selector: {
          $or: [
            { name: { $regex: normalizedText, $options: 'i' } },
            { aliases: { $elemMatch: { $regex: normalizedText, $options: 'i' } } }
          ]
        }
      });
    } else {
      query = db.active_ingredients.find();
    }

    // Obtener todos los resultados para calcular el total
    const allIngredients = await query.exec();
    const totalItems = allIngredients.length;
    const totalPages = Math.ceil(totalItems / size);

    // Aplicar paginación
    const skip = (page - 1) * size;
    const paginatedIngredients = allIngredients
      .slice(skip, skip + size)
      .map((ingredient) => JSON.parse(JSON.stringify(ingredient.toJSON())) as ActiveIngredient);

    return {
      items: paginatedIngredients,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async search(searchText: string): Promise<ActiveIngredient[]> {
    if (!searchText || searchText.trim() === "") {
      return this.findAll();
    }
    const db = await initDatabase();
    const normalizedText = searchText.trim().toLowerCase();
    const allIngredients = await db.active_ingredients.find().exec();
    
    const filteredIngredients = allIngredients.filter((ingredient) => {
      const ingredientJson = ingredient.toJSON();
      return (
        ingredientJson.name.toLowerCase().includes(normalizedText) ||
        (ingredientJson.aliases && ingredientJson.aliases.some(alias => alias.toLowerCase().includes(normalizedText)))
      );
    });
    return filteredIngredients.map((ingredient) => JSON.parse(JSON.stringify(ingredient.toJSON())) as ActiveIngredient);
  }
}

export class FirestoreActiveIngredientRepository implements IActiveIngredientRepository {
  async create(_ingredientData: Omit<ActiveIngredient, 'id'>): Promise<ActiveIngredient> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByName(_name: string): Promise<ActiveIngredient | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<ActiveIngredient | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<ActiveIngredient[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<ActiveIngredient>> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<ActiveIngredient>): Promise<ActiveIngredient | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async search(_searchText: string): Promise<ActiveIngredient[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localActiveIngredientRepository = new LocalActiveIngredientRepository();
export const firestoreActiveIngredientRepository = new FirestoreActiveIngredientRepository();

export const getActiveIngredientRepository = (): IActiveIngredientRepository => {
  return config.APP_MODE === 'local' ? localActiveIngredientRepository : firestoreActiveIngredientRepository;
};