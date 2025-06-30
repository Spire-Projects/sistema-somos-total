import type { Manufacturer } from '../../types/Medication';
import type { ItemsResponse } from '../../types/UtilTypes';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';

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

export class LocalManufacturerRepository implements IManufacturerRepository {
  async create(manufacturerData: Omit<Manufacturer, 'id'>): Promise<Manufacturer> {
    const db = await initDatabase();
    const id = crypto.randomUUID();
    const manufacturer = await db.manufacturers.insert({ id, ...manufacturerData });
    return JSON.parse(JSON.stringify(manufacturer.toJSON())) as Manufacturer;
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

  async findById(id: string): Promise<Manufacturer | null> {
    const db = await initDatabase();
    const manufacturer = await db.manufacturers.findOne(id).exec();
    return manufacturer ? JSON.parse(JSON.stringify(manufacturer.toJSON())) as Manufacturer : null;
  }

  async findAll(): Promise<Manufacturer[]> {
    const db = await initDatabase();
    const manufacturers = await db.manufacturers.find({
      selector: { isDeleted: { $ne: true } }
    }).exec();
    return manufacturers.map((manufacturer) => JSON.parse(JSON.stringify(manufacturer.toJSON())) as Manufacturer);
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

  async update(id: string, updateData: Partial<Manufacturer>): Promise<Manufacturer | null> {
    const db = await initDatabase();
    const manufacturer = await db.manufacturers.findOne(id).exec();
    if (!manufacturer) return null;
    await manufacturer.update({ $set: updateData });
    return JSON.parse(JSON.stringify(manufacturer.toJSON())) as Manufacturer;
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const manufacturer = await db.manufacturers.findOne(id).exec();
    if (!manufacturer) return false;
    
    // Soft delete
    await manufacturer.update({
      $set: {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      }
    });
    return true;
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