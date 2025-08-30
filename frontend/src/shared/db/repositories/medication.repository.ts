import type { ItemsResponse } from '@/shared/types/UtilTypes';
import type { Medication } from '../../types/Medication';
import type { 
  MedicationCatalogFilters, 
  MedicationCatalogSort 
} from '../../types/MedicationViewTypes';
import type { RxCollection } from 'rxdb';
import { config } from '@/shared/config/config';
import { findGenericNameById, searchGenericNames } from '@/shared/services/GenericNameService';
import { BaseRepository } from './BaseRepository';

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

export class LocalMedicationDB extends BaseRepository<Medication> implements IMedicationRepository {
  protected async getCollection(): Promise<MedicationCollection> {
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
    return await this.createWithPriority(data);
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
    return await this.updateWithPriority(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return await this.deleteWithPriority(id);
  }

  async search(query: string): Promise<Medication[]> {
    if (!query.trim()) {
      return this.findAll();
    }

    const collection = await this.getCollection();
    const trimmedQuery = query.trim();
    
    // 1. Buscar GenericNames que coincidan con el query
    const matchingGenericNames = await searchGenericNames(trimmedQuery);
    const genericNameIds = matchingGenericNames.map(g => g.id);

    // 2. Construir condiciones de búsqueda híbrida
    const searchConditions: any[] = [
      { comercialName: { $regex: trimmedQuery, $options: 'i' } },
      { tradeName: { $regex: trimmedQuery, $options: 'i' } },
      { description: { $regex: trimmedQuery, $options: 'i' } },
      { barcode: { $eq: trimmedQuery } }
    ];

    // 3. Agregar búsqueda por genericName IDs solo si hay coincidencias
    if (genericNameIds.length > 0) {
      searchConditions.push({ genericName: { $in: genericNameIds } });
    }

    const docs = await collection.find({
      selector: {
        $and: [
          { isDeleted: { $ne: true } },
          { $or: searchConditions }
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

      // Filtro de búsqueda híbrida por texto
      if (filters.searchQuery) {
        const trimmedQuery = filters.searchQuery.trim();
        
        // Buscar GenericNames que coincidan con el query
        const matchingGenericNames = await searchGenericNames(trimmedQuery);
        const genericNameIds = matchingGenericNames.map(g => g.id);

        // Construir condiciones de búsqueda híbrida
        const searchConditions: any[] = [
          { comercialName: { $regex: trimmedQuery, $options: 'i' } },
          { tradeName: { $regex: trimmedQuery, $options: 'i' } },
          { description: { $regex: trimmedQuery, $options: 'i' } },
          { barcode: { $eq: trimmedQuery } }
        ];

        // Agregar búsqueda por genericName IDs solo si hay coincidencias
        if (genericNameIds.length > 0) {
          searchConditions.push({ genericName: { $in: genericNameIds } });
        }

        selector.$and = selector.$and || [];
        selector.$and.push({ $or: searchConditions });
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

    // Obtener total de elementos - usar find().length para selectores complejos
    let totalItems: number;
    const hasComplexSelector = selector.$and || selector.$or || 
                              (selector.createdAt && (selector.createdAt.$gte || selector.createdAt.$lte)) ||
                              (selector.updatedAt && (selector.updatedAt.$gte || selector.updatedAt.$lte));
    
    if (hasComplexSelector) {
      // Para selectores complejos, usar find().length para evitar QU14
      const allDocs = await collection.find({ selector }).exec();
      totalItems = allDocs.length;
    } else {
      // Para selectores simples, usar count() que es más eficiente
      totalItems = await collection.count({ selector }).exec();
    }

    // Obtener elementos paginados
    const docs = await collection.find({
      selector,
      sort: sortConfig,
      skip,
      limit: size
    }).exec();

    const rawItems = docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);

    const items = await Promise.all(
      rawItems.map(async (med) => {
        if (med.genericName) {
          const generic = await findGenericNameById(med.genericName);
          return {
            ...med,
            genericName: generic?.name || "Desconocido",
          };
        }
        return {
          ...med,
          genericName: "Sin genérico",
        };
      })
    );

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
   * Búsqueda híbrida de medicamentos con paginación
   * Busca tanto por nombres genéricos como por otros campos del medicamento
   */
  async searchMedicationsPaginated(
    query: string, 
    page: number, 
    size: number,
    filters?: MedicationCatalogFilters
  ): Promise<ItemsResponse<Medication>> {
    if (!query.trim()) {
      // Si no hay query, usar filtros normales
      return this.findAllPaginatedWithFilters(page, size, filters);
    }

    const collection = await this.getCollection();
    const skip = (page - 1) * size;
    const trimmedQuery = query.trim();

    // 1. Buscar GenericNames que coincidan con el query
    const matchingGenericNames = await searchGenericNames(trimmedQuery);
    const genericNameIds = matchingGenericNames.map(g => g.id);

    // 2. Construir selector base
    const baseSelector: any = { isDeleted: false };
    
    // 3. Aplicar filtros adicionales si existen
    if (filters) {
      if (filters.categoryId) {
        baseSelector.categoryId = filters.categoryId;
      }
      if (filters.manufacturerId) {
        baseSelector.manufacturerId = filters.manufacturerId;
      }
      if (filters.pharmaceuticalFormId) {
        baseSelector.pharmaceuticalFormId = filters.pharmaceuticalFormId;
      }
      // Omitir searchQuery ya que lo manejamos de forma híbrida
    }

    // 4. Construir condiciones de búsqueda híbrida
    const searchConditions: any[] = [
      { tradeName: { $regex: trimmedQuery, $options: 'i' } },
      { comercialName: { $regex: trimmedQuery, $options: 'i' } },
      { description: { $regex: trimmedQuery, $options: 'i' } },
      { barcode: { $eq: trimmedQuery } }
    ];

    // 5. Agregar búsqueda por genericName IDs solo si hay coincidencias
    if (genericNameIds.length > 0) {
      searchConditions.push({ genericName: { $in: genericNameIds } });
    }

    // 6. Combinar selector base con condiciones de búsqueda
    const finalSelector = {
      ...baseSelector,
      $or: searchConditions
    };

    // 7. Obtener total de elementos
    const allDocs = await collection.find({ selector: finalSelector }).exec();
    const totalItems = allDocs.length;

    // 8. Obtener elementos paginados
    const docs = await collection.find({
      selector: finalSelector,
      sort: [{ tradeName: 'asc' }],
      skip,
      limit: size
    }).exec();

    // 9. Procesar resultados y resolver nombres genéricos
    const rawItems = docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as Medication);

    const items = await Promise.all(
      rawItems.map(async (med) => {
        if (med.genericName) {
          const generic = await findGenericNameById(med.genericName);
          return {
            ...med,
            genericName: generic?.name || "Desconocido",
          };
        }
        return {
          ...med,
          genericName: "Sin genérico",
        };
      })
    );

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