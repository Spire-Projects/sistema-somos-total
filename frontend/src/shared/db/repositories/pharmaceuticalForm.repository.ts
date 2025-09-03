import type { PharmaceuticalFormDoc } from '../../types/Medication';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';

export interface IPharmaceuticalFormRepository {
  create(pharmaceuticalFormData: Omit<PharmaceuticalFormDoc, 'id'>): Promise<PharmaceuticalFormDoc>;
  findByName(name: string): Promise<PharmaceuticalFormDoc | null>;
  findById(id: string): Promise<PharmaceuticalFormDoc | null>;
  findAll(): Promise<PharmaceuticalFormDoc[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<PharmaceuticalFormDoc>>;
  update(id: string, updateData: Partial<PharmaceuticalFormDoc>): Promise<PharmaceuticalFormDoc | null>;
  delete(id: string): Promise<boolean>;
  search(searchText: string): Promise<PharmaceuticalFormDoc[]>;
}

export class LocalPharmaceuticalFormRepository extends BaseRepository<PharmaceuticalFormDoc> implements IPharmaceuticalFormRepository {
  
  protected async getCollection(): Promise<RxCollection<PharmaceuticalFormDoc>> {
    const db = await initDatabase();
    return db.pharmaceutical_forms;
  }

  async create(pharmaceuticalFormData: Omit<PharmaceuticalFormDoc, 'id'>): Promise<PharmaceuticalFormDoc> {
    const id = crypto.randomUUID();
    const fullData = { id, ...pharmaceuticalFormData } as PharmaceuticalFormDoc;
    console.log(`🔄 PharmaceuticalFormRepository: Creando forma farmacéutica con prioridad`, { id });
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<PharmaceuticalFormDoc>): Promise<PharmaceuticalFormDoc | null> {
    console.log(`🔄 PharmaceuticalFormRepository: Actualizando forma farmacéutica ${id} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar forma farmacéutica ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ PharmaceuticalFormRepository: Eliminando forma farmacéutica ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<PharmaceuticalFormDoc | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<PharmaceuticalFormDoc[]> {
    return await super.findAll();
  }

  async findByName(name: string): Promise<PharmaceuticalFormDoc | null> {
    const db = await initDatabase();
    const pharmaceuticalForm = await db.pharmaceutical_forms.findOne({ 
      selector: { 
        name,
        _deleted: { $eq: false }
      } as any
    }).exec();
    return pharmaceuticalForm ? JSON.parse(JSON.stringify(pharmaceuticalForm.toJSON())) as PharmaceuticalFormDoc : null;
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<PharmaceuticalFormDoc>> {
    const db = await initDatabase();
    
    let query;
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      query = db.pharmaceutical_forms.find({
        selector: {
          $and: [
            { _deleted: { $eq: false } },
            {
              $or: [
                { name: { $regex: normalizedText, $options: 'i' } },
                { description: { $regex: normalizedText, $options: 'i' } },
                { aliases: { $elemMatch: { $regex: normalizedText, $options: 'i' } } }
              ]
            }
          ]
        } as any
      });
    } else {
      query = db.pharmaceutical_forms.find({
        selector: { _deleted: { $eq: false } } as any
      });
    }

    // Obtener todos los resultados para calcular el total
    const allForms = await query.exec();
    const totalItems = allForms.length;
    const totalPages = Math.ceil(totalItems / size);

    // Aplicar paginación
    const skip = (page - 1) * size;
    const paginatedForms = allForms
      .slice(skip, skip + size)
      .map((form) => JSON.parse(JSON.stringify(form.toJSON())) as PharmaceuticalFormDoc);

    return {
      items: paginatedForms,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  // Métodos originales comentados para evitar conflictos con BaseRepository
  /*
  async update(id: string, updateData: Partial<PharmaceuticalFormDoc>): Promise<PharmaceuticalFormDoc | null> {
    const db = await initDatabase();
    const form = await db.pharmaceutical_forms.findOne(id).exec();
    if (!form) return null;
    await form.update({ $set: updateData });
    return JSON.parse(JSON.stringify(form.toJSON())) as PharmaceuticalFormDoc;
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const form = await db.pharmaceutical_forms.findOne(id).exec();
    if (!form) return false;
    
    // Soft delete
    await form.update({
      $set: {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      }
    });
    return true;
  }
  */

  async search(searchText: string): Promise<PharmaceuticalFormDoc[]> {
    if (!searchText || searchText.trim() === "") {
      return this.findAll();
    }
    const db = await initDatabase();
    const normalizedText = searchText.trim().toLowerCase();
    const allForms = await db.pharmaceutical_forms.find({
      selector: { _deleted: { $eq: false } } as any
    }).exec();
    
    const filteredForms = allForms.filter((form) => {
      const formJson = form.toJSON();
      return (
        formJson.name.toLowerCase().includes(normalizedText) ||
        (formJson.description && formJson.description.toLowerCase().includes(normalizedText)) ||
        (formJson.aliases && formJson.aliases.some(alias => alias.toLowerCase().includes(normalizedText)))
      );
    });
    return filteredForms.map((form) => JSON.parse(JSON.stringify(form.toJSON())) as PharmaceuticalFormDoc);
  }
}

export class FirestorePharmaceuticalFormRepository implements IPharmaceuticalFormRepository {
  async create(_formData: Omit<PharmaceuticalFormDoc, 'id'>): Promise<PharmaceuticalFormDoc> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByName(_name: string): Promise<PharmaceuticalFormDoc | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<PharmaceuticalFormDoc | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<PharmaceuticalFormDoc[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<PharmaceuticalFormDoc>> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<PharmaceuticalFormDoc>): Promise<PharmaceuticalFormDoc | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async search(_searchText: string): Promise<PharmaceuticalFormDoc[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localPharmaceuticalFormRepository = new LocalPharmaceuticalFormRepository();
export const firestorePharmaceuticalFormRepository = new FirestorePharmaceuticalFormRepository();

export const getPharmaceuticalFormRepository = (): IPharmaceuticalFormRepository => {
  return config.APP_MODE === 'local' ? localPharmaceuticalFormRepository : firestorePharmaceuticalFormRepository;
};