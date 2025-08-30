import type { Manufacturer } from '../../types/Medication';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';

export interface IManufacturerRepository {
  create(manufacturerData: Omit<Manufacturer, 'id'>): Promise<Manufacturer>;
  findByName(name: string): Promise<Manufacturer | null>;
  findById(id: string): Promise<Manufacturer | null>;
  findAll(): Promise<Manufacturer[]>;
  findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Manufacturer>>;
  update(id: string, updateData: Partial<Manufacturer>): Promise<Manufacturer | null>;
  delete(id: string): Promise<boolean>;
  search(searchText: string): Promise<Manufacturer[]>;
}

export class LocalManufacturerRepository extends BaseRepository<Manufacturer> implements IManufacturerRepository {
  
  protected async getCollection(): Promise<RxCollection<Manufacturer>> {
    const db = await initDatabase();
    return db.manufacturers;
  }

  async create(manufacturerData: Omit<Manufacturer, 'id'>): Promise<Manufacturer> {
    const id = crypto.randomUUID();
    const fullData = { id, ...manufacturerData } as Manufacturer;
    console.log(`🔄 ManufacturerRepository: Creando fabricante con prioridad`, { id });
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<Manufacturer>): Promise<Manufacturer | null> {
    console.log(`🔄 ManufacturerRepository: Actualizando fabricante ${id} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar fabricante ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ ManufacturerRepository: Eliminando fabricante ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<Manufacturer | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<Manufacturer[]> {
    return await super.findAll();
  }

  async findByName(name: string): Promise<Manufacturer | null> {
    const db = await initDatabase();
    const manufacturer = await db.manufacturers.findOne({ 
      selector: { 
        name,
        isDeleted: { $ne: true }
      } 
    }).exec();
    return manufacturer ? JSON.parse(JSON.stringify(manufacturer.toJSON())) as Manufacturer : null;
  }

  async findAllPaginated(page: number, size: number, searchQuery?: string): Promise<ItemsResponse<Manufacturer>> {
    const db = await initDatabase();
    
    let query;
    if (searchQuery && searchQuery.trim() !== "") {
      const normalizedText = searchQuery.trim().toLowerCase();
      query = db.manufacturers.find({
        selector: {
          $and: [
            { isDeleted: { $ne: true } },
            {
              $or: [
                { name: { $regex: normalizedText, $options: 'i' } },
                { country: { $regex: normalizedText, $options: 'i' } },
                { contactEmail: { $regex: normalizedText, $options: 'i' } }
              ]
            }
          ]
        }
      });
    } else {
      query = db.manufacturers.find({
        selector: { isDeleted: { $ne: true } }
      });
    }

    // Obtener todos los resultados para calcular el total
    const allManufacturers = await query.exec();
    const totalItems = allManufacturers.length;
    const totalPages = Math.ceil(totalItems / size);

    // Aplicar paginación
    const skip = (page - 1) * size;
    const paginatedManufacturers = allManufacturers
      .slice(skip, skip + size)
      .map((manufacturer) => JSON.parse(JSON.stringify(manufacturer.toJSON())) as Manufacturer);

    return {
      items: paginatedManufacturers,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async search(searchText: string): Promise<Manufacturer[]> {
    if (!searchText || searchText.trim() === "") {
      return this.findAll();
    }
    const db = await initDatabase();
    const normalizedText = searchText.trim().toLowerCase();
    const allManufacturers = await db.manufacturers.find({
      selector: { isDeleted: { $ne: true } }
    }).exec();
    
    const filteredManufacturers = allManufacturers.filter((manufacturer) => {
      const manufacturerJson = manufacturer.toJSON();
      return (
        manufacturerJson.name.toLowerCase().includes(normalizedText) ||
        (manufacturerJson.country && manufacturerJson.country.toLowerCase().includes(normalizedText)) ||
        (manufacturerJson.contactEmail && manufacturerJson.contactEmail.toLowerCase().includes(normalizedText))
      );
    });
    return filteredManufacturers.map((manufacturer) => JSON.parse(JSON.stringify(manufacturer.toJSON())) as Manufacturer);
  }
}

export class FirestoreManufacturerRepository implements IManufacturerRepository {
  async create(_manufacturerData: Omit<Manufacturer, 'id'>): Promise<Manufacturer> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByName(_name: string): Promise<Manufacturer | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<Manufacturer | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<Manufacturer[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAllPaginated(_page: number, _size: number, _searchQuery?: string): Promise<ItemsResponse<Manufacturer>> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<Manufacturer>): Promise<Manufacturer | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async search(_searchText: string): Promise<Manufacturer[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localManufacturerRepository = new LocalManufacturerRepository();
export const firestoreManufacturerRepository = new FirestoreManufacturerRepository();

export const getManufacturerRepository = (): IManufacturerRepository => {
  return config.APP_MODE === 'local' ? localManufacturerRepository : firestoreManufacturerRepository;
};