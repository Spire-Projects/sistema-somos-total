import type { ActiveIngredient } from '../../types/Medication';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';

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

export class LocalActiveIngredientRepository implements IActiveIngredientRepository {
  async create(ingredientData: Omit<ActiveIngredient, 'id'>): Promise<ActiveIngredient> {
    const db = await initDatabase();
    const id = crypto.randomUUID();
    const ingredient = await db.active_ingredients.insert({ id, ...ingredientData });
    return JSON.parse(JSON.stringify(ingredient.toJSON())) as ActiveIngredient;
  }

  async findByName(name: string): Promise<ActiveIngredient | null> {
    const db = await initDatabase();
    const ingredient = await db.active_ingredients.findOne({ 
      selector: { name }
    }).exec();
    return ingredient ? JSON.parse(JSON.stringify(ingredient.toJSON())) as ActiveIngredient : null;
  }

  async findById(id: string): Promise<ActiveIngredient | null> {
    const db = await initDatabase();
    const ingredient = await db.active_ingredients.findOne(id).exec();
    return ingredient ? JSON.parse(JSON.stringify(ingredient.toJSON())) as ActiveIngredient : null;
  }

  async findAll(): Promise<ActiveIngredient[]> {
    const db = await initDatabase();
    const ingredients = await db.active_ingredients.find().exec();
    return ingredients.map((ingredient) => JSON.parse(JSON.stringify(ingredient.toJSON())) as ActiveIngredient);
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

  async update(id: string, updateData: Partial<ActiveIngredient>): Promise<ActiveIngredient | null> {
    const db = await initDatabase();
    const ingredient = await db.active_ingredients.findOne(id).exec();
    if (!ingredient) return null;
    await ingredient.update({ $set: updateData });
    return JSON.parse(JSON.stringify(ingredient.toJSON())) as ActiveIngredient;
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const ingredient = await db.active_ingredients.findOne(id).exec();
    if (!ingredient) return false;
    await ingredient.remove();
    return true;
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