import type { ItemsResponse } from '@/shared/types/UtilTypes';
import type { Medication } from '../../types/Medication';
import type { 
  MedicationCatalogFilters, 
  MedicationCatalogSort 
} from '../../types/MedicationViewTypes';
import type { RxCollection } from 'rxdb';
import { config } from '@/shared/config/config';

export interface IMedicationRepository {
  // CRUD básico existente
  create(data: Omit<Medication, 'id'> & { id: string }): Promise<Medication>;
  findById(id: string): Promise<Medication | null>;
  findAll(): Promise<Medication[]>;
  find(page: number, size: number) : Promise<ItemsResponse <Medication>>;
  findByTradeName(tradeName: string): Promise<Medication | null>;
  findByBarcode(barcode: string): Promise<Medication | null>;
  findByCategory(categoryId: string): Promise<Medication[]>;
  findByManufacturer(manufacturerId: string): Promise<Medication[]>;
  update(id: string, data: Partial<Medication>): Promise<Medication>;
  delete(id: string): Promise<boolean>;
  search(query: string): Promise<Medication[]>;
  
  // 🆕 NUEVOS MÉTODOS PARA CATÁLOGO OPTIMIZADO
  findAllPaginatedWithFilters(
    page: number, 
    size: number, 
    filters?: MedicationCatalogFilters,
    sort?: MedicationCatalogSort
  ): Promise<ItemsResponse<Medication>>;
  
  searchMedicationsPaginated(
    query: string, 
    page: number, 
    size: number,
    filters?: MedicationCatalogFilters
  ): Promise<ItemsResponse<Medication>>;
  
  countMedicationsWithFilters(filters?: MedicationCatalogFilters): Promise<number>;
  
  findMedicationsByIds(ids: string[]): Promise<Medication[]>;
}

export type MedicationCollection = RxCollection<Medication>;

export class LocalMedicationDB implements IMedicationRepository {
  private async getCollection(): Promise<MedicationCollection> {
    const { getDatabase } = await import('../database');
    const db = getDatabase();
    if (!db) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db.medications;
  }

  async find(page: number, size: number): Promise<ItemsResponse<Medication>> {
    const collection = await this.getCollection();
    const skip = (page - 1) * size;

    // Buscar todos los medicamentos no eliminados y ordenados por tradeName ascendente
    const allDocs = await collection.find({
      selector: { isDeleted: { $ne: true } },
      sort: [{ tradeName: 'asc' }]
    }).exec();

    const totalItems = allDocs.length;
    const totalPages = Math.ceil(totalItems / size);

    const items = allDocs
      .slice(skip, skip + size)
      .map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);

    return {
      items,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  async create(data: Omit<Medication, 'id'> & { id: string }): Promise<Medication> {
    const collection = await this.getCollection();
    const doc = await collection.insert(data);
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medication;
  }

  async findById(id: string): Promise<Medication | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findAll(): Promise<Medication[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: { isDeleted: { $ne: true } }
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async findByTradeName(tradeName: string): Promise<Medication | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({
      selector: { 
        tradeName: { $eq: tradeName },
        isDeleted: { $ne: true }
      }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findByBarcode(barcode: string): Promise<Medication | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({
      selector: { 
        barcode: { $eq: barcode },
        isDeleted: { $ne: true }
      }
    }).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as Medication : null;
  }

  async findByCategory(categoryId: string): Promise<Medication[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: { 
        categoryId: { $eq: categoryId },
        isDeleted: { $ne: true }
      }
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async findByManufacturer(manufacturerId: string): Promise<Medication[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: { 
        manufacturerId: { $eq: manufacturerId },
        isDeleted: { $ne: true }
      }
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  async update(id: string, data: Partial<Medication>): Promise<Medication> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    if (!doc) throw new Error('Medication not found');
    
    await doc.update({
      $set: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    });
    
    return JSON.parse(JSON.stringify(doc.toJSON())) as Medication;
  }

  async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    if (!doc) return false;
    
    // Soft delete
    await doc.update({
      $set: {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      }
    });
    return true;
  }

  async search(query: string): Promise<Medication[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: {
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [
            {comercialName: { $regex: query, $options: 'i' } },
              { tradeName: { $regex: query, $options: 'i' } },
              { genericName: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { barcode: { $eq: query } }
            ]
          }
        ]
      }
    }).exec();
    
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }

  // 🆕 NUEVOS MÉTODOS PARA CATÁLOGO OPTIMIZADO

  /**
   * Busca medicamentos con filtros y paginación optimizada
   */
  async findAllPaginatedWithFilters(
    page: number, 
    size: number, 
    filters?: MedicationCatalogFilters,
    sort?: MedicationCatalogSort
  ): Promise<ItemsResponse<Medication>> {
    const collection = await this.getCollection();
    const skip = (page - 1) * size;

    // Construir selector basado en filtros - usar isDeleted: false para mejor performance
    const selector: any = { isDeleted: false };

    if (filters) {
      // Filtro por categoría
      if (filters.categoryId) {
        selector.categoryId = filters.categoryId;
      }

      // Filtro por fabricante
      if (filters.manufacturerId) {
        selector.manufacturerId = filters.manufacturerId;
      }

      // Filtro por forma farmacéutica
      if (filters.pharmaceuticalFormId) {
        selector.pharmaceuticalFormId = filters.pharmaceuticalFormId;
      }

      // Filtro de búsqueda por texto
      if (filters.searchQuery) {
        selector.$and = selector.$and || [];
        selector.$and.push({
          $or: [
            { comercialName: { $regex: filters.searchQuery, $options: 'i' } },
            { tradeName: { $regex: filters.searchQuery, $options: 'i' } },
            { genericName: { $regex: filters.searchQuery, $options: 'i' } },
            { description: { $regex: filters.searchQuery, $options: 'i' } },
            { barcode: { $eq: filters.searchQuery } }
          ]
        });
      }

      // Filtros de fecha
      if (filters.createdFrom || filters.createdTo) {
        selector.createdAt = {};
        if (filters.createdFrom) {
          selector.createdAt.$gte = filters.createdFrom;
        }
        if (filters.createdTo) {
          selector.createdAt.$lte = filters.createdTo;
        }
      }

      if (filters.updatedFrom || filters.updatedTo) {
        selector.updatedAt = {};
        if (filters.updatedFrom) {
          selector.updatedAt.$gte = filters.updatedFrom;
        }
        if (filters.updatedTo) {
          selector.updatedAt.$lte = filters.updatedTo;
        }
      }
    }

    // Configurar ordenamiento
    const sortConfig: any[] = [];
    if (sort) {
      const sortOrder = sort.order === 'desc' ? 'desc' : 'asc';
      sortConfig.push({ [sort.field]: sortOrder });
    } else {
      // Ordenamiento por defecto
      sortConfig.push({ tradeName: 'asc' });
    }

    // Obtener total de elementos
    const totalItems = await collection.count({ selector }).exec();

    // Obtener elementos paginados
    const docs = await collection.find({
      selector,
      sort: sortConfig,
      skip,
      limit: size
    }).exec();

    const items = docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
    const totalPages = Math.ceil(totalItems / size);

    return {
      items,
      page,
      size,
      totalItems,
      totalPages
    };
  }

  /**
   * Búsqueda de medicamentos con paginación
   */
  async searchMedicationsPaginated(
    query: string, 
    page: number, 
    size: number,
    filters?: MedicationCatalogFilters
  ): Promise<ItemsResponse<Medication>> {
    // Crear filtros combinando la búsqueda con los filtros adicionales
    const combinedFilters: MedicationCatalogFilters = {
      ...filters,
      searchQuery: query
    };

    return this.findAllPaginatedWithFilters(page, size, combinedFilters);
  }

  /**
   * Cuenta medicamentos que coinciden con los filtros
   */
  async countMedicationsWithFilters(filters?: MedicationCatalogFilters): Promise<number> {
    const collection = await this.getCollection();
    
    // Simplificar selector para evitar slow queries
    const selector: any = { isDeleted: false };

    if (filters) {
      if (filters.categoryId) {
        selector.categoryId = filters.categoryId;
      }
      if (filters.manufacturerId) {
        selector.manufacturerId = filters.manufacturerId;
      }
      if (filters.pharmaceuticalFormId) {
        selector.pharmaceuticalFormId = filters.pharmaceuticalFormId;
      }
      // Remover searchQuery de count para simplificar
    }

    // Usar find().length para consultas simples y count() para básicas
    if (Object.keys(selector).length <= 2) {
      return await collection.count({ selector }).exec();
    } else {
      const docs = await collection.find({ selector }).exec();
      return docs.length;
    }
  }

  /**
   * Busca medicamentos por una lista de IDs (optimizado para catálogo)
   */
  async findMedicationsByIds(ids: string[]): Promise<Medication[]> {
    if (ids.length === 0) return [];

    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: {
        isDeleted: { $ne: true },
        id: { $in: ids }
      },
      sort: [{ tradeName: 'asc' }]
    }).exec();

    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);
  }
}


export class FirestoreMedicationDB implements IMedicationRepository {
  async find(_page: number, _size: number): Promise<ItemsResponse<Medication>> {
    throw new Error('Firestore implementation not yet available');
  }

  async create(_data: Omit<Medication, 'id'> & { id: string }): Promise<Medication> {
    throw new Error('Firestore implementation not yet available');
  }

  async findById(_id: string): Promise<Medication | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findAll(): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByTradeName(_tradeName: string): Promise<Medication | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByBarcode(_barcode: string): Promise<Medication | null> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByCategory(_categoryId: string): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async findByManufacturer(_manufacturerId: string): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }

  async update(_id: string, _data: Partial<Medication>): Promise<Medication> {
    throw new Error('Firestore implementation not yet available');
  }

  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }

  async search(_query: string): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }

  // 🆕 NUEVOS MÉTODOS PARA CATÁLOGO OPTIMIZADO - FIRESTORE PLACEHOLDERS
  async findAllPaginatedWithFilters(
    _page: number, 
    _size: number, 
    _filters?: MedicationCatalogFilters,
    _sort?: MedicationCatalogSort
  ): Promise<ItemsResponse<Medication>> {
    throw new Error('Firestore implementation not yet available');
  }
  
  async searchMedicationsPaginated(
    _query: string, 
    _page: number, 
    _size: number,
    _filters?: MedicationCatalogFilters
  ): Promise<ItemsResponse<Medication>> {
    throw new Error('Firestore implementation not yet available');
  }
  
  async countMedicationsWithFilters(_filters?: MedicationCatalogFilters): Promise<number> {
    throw new Error('Firestore implementation not yet available');
  }
  
  async findMedicationsByIds(_ids: string[]): Promise<Medication[]> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const LocalMedicationDb = new LocalMedicationDB();
export const FirestoreMedicationDb = new FirestoreMedicationDB();

export const getMedicationRepository = (): IMedicationRepository => {
  return config.APP_MODE === 'local' ? LocalMedicationDb : FirestoreMedicationDb;
};