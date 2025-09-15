import type { RxCollection } from "rxdb";
import type {
  MedicationBatch,
  BatchFilters,
  BatchSearchResult,
  BatchStatistics,
} from "../../types/Medication";
import type {
  CreateMedicationBatchData,
  UpdateMedicationBatchData,
} from "../../types/MedicationCrud";
import { generateId } from "../../utils/id.utils";
import { config } from "../../config/config";
import type { ItemsResponse } from "@/shared/types/UtilTypes";

// Tipos para el repositorio
export interface IMedicationBatchRepository {
  // CRUD básico
  create(data: CreateMedicationBatchData): Promise<MedicationBatch>;
  findById(id: string): Promise<MedicationBatch | null>;
  update(id: string, data: UpdateMedicationBatchData): Promise<MedicationBatch>;
  delete(id: string): Promise<void>;

  // Búsquedas especializadas
  findByMedicationId(
    medicationId: string,
    page?: number,
    size?: number
  ): Promise<BatchSearchResult>;
  findWithFilters(
    filters: BatchFilters,
    page?: number,
    size?: number
  ): Promise<BatchSearchResult>;
  findBatchesExpiringInDays(days: number): Promise<MedicationBatch[]>;
  findBatchesBySupplier(supplier: string): Promise<MedicationBatch[]>;
  searchByBatchId(batchId: string): Promise<MedicationBatch[]>;
  searchByBatchIdPaginated(
    batchId: string,
    page: number,
    size: number
  ): Promise<{
    batches: MedicationBatch[];
    totalItems: number;
    totalPages: number;
  }>;

  // Estadísticas
  getTotalStockByMedicationId(medicationId: string): Promise<number>;
  getBatchCountByMedicationId(medicationId: string): Promise<number>;
  getStatistics(medicationId?: string): Promise<BatchStatistics>;

  // 🆕 NUEVOS MÉTODOS PARA STOCK ACTIVO
  getTotalActiveStockByMedicationId(medicationId: string): Promise<number>;
  getActiveBatchCountByMedicationId(medicationId: string): Promise<number>;
  findActiveBatchesByMedicationId(
    medicationId: string
  ): Promise<MedicationBatch[]>;
  findActiveBatchesByMedicationIdPaginated(
    medicationId: string,
    page: number,
    size: number
  ): Promise<ItemsResponse<MedicationBatch>>;

  getOldestActiveBatchByMedicationId(
    medicationId: string
  ): Promise<MedicationBatch | null>;
  findMedicationIdsWithActiveStock(): Promise<string[]>;

  // 🆕 NUEVO MÉTODO PARA ESTADÍSTICAS GLOBALES OPTIMIZADAS
  getExpiringAndExpiredBatchesCount(daysToExpire: number): Promise<{
    expiring: number;
    expired: number;
    total: number;
  }>;

  // 🆕 MÉTODO PARA CONTAR TOTAL DE LOTES ACTIVOS GLOBALMENTE
  getTotalActiveBatchesCount(): Promise<number>;

  // Validaciones
  batchIdExistsForMedication(
    medicationId: string,
    batchId: string,
    excludeId?: string
  ): Promise<boolean>;
}

/**
 * Repositorio local para MedicationBatch usando RxDB
 */
export class LocalMedicationBatchRepository
  implements IMedicationBatchRepository
{
  private async getCollection(): Promise<RxCollection<MedicationBatch>> {
    const { getDatabase } = await import("../database");
    const db = getDatabase();
    if (!db) {
      throw new Error("Database not initialized. Call initDatabase() first.");
    }
    return db.medication_batches;
  }

  async create(data: CreateMedicationBatchData): Promise<MedicationBatch> {
    const collection = await this.getCollection();
    const id = generateId();
    const now = new Date().toISOString();

    const batch: MedicationBatch = {
      id,
      medicationId: data.medicationId,
      batchId: data.batchId,
      expirationDate: data.expirationDate,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      purchaseDate: data.purchaseDate,
      supplier: data.supplier,
      sincronized: false,
      isDeleted: false,
      createdAt: now,
      createdBy: data.createdBy,
      updatedAt: now,
      updatedBy: data.createdBy,
    };

    const doc = await collection.insert(batch);
    return doc.toJSON();
  }

  async findById(id: string): Promise<MedicationBatch | null> {
    const collection = await this.getCollection();
    const doc = await collection
      .findOne({
        selector: {
          id,
          isDeleted: false,
        },
      })
      .exec();

    return doc ? doc.toJSON() : null;
  }

  async update(
    id: string,
    data: UpdateMedicationBatchData
  ): Promise<MedicationBatch> {
    const collection = await this.getCollection();
    const doc = await collection
      .findOne({
        selector: {
          id,
          isDeleted: false,
        },
      })
      .exec();

    if (!doc) {
      throw new Error(`Batch with id ${id} not found`);
    }

    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
      sincronized: false,
    };

    await doc.update({
      $set: updateData,
    });

    return doc.toJSON();
  }

  async delete(id: string): Promise<void> {
    const collection = await this.getCollection();
    const doc = await collection
      .findOne({
        selector: {
          id,
          isDeleted: false,
        },
      })
      .exec();

    if (!doc) {
      throw new Error(`Batch with id ${id} not found`);
    }

    const now = new Date().toISOString();
    await doc.update({
      $set: {
        isDeleted: true,
        updatedAt: now,
        sincronized: false,
      },
    });
  }

  async findByMedicationId(
    medicationId: string,
    page: number = 1,
    size: number = 10
  ): Promise<BatchSearchResult> {
    const collection = await this.getCollection();
    const skip = (page - 1) * size;

    // Obtener total de elementos - selector simple, usar count() directamente
    const totalItems = await collection
      .count({
        selector: {
          medicationId,
          isDeleted: false, // Usar false en lugar de { $ne: true }
        },
      })
      .exec();

    // Obtener elementos paginados
    const docs = await collection
      .find({
        selector: {
          medicationId,
          isDeleted: false,
        },
        sort: [{ expirationDate: "asc" }],
        skip,
        limit: size,
      })
      .exec();

    const batches = docs.map((doc: any) => doc.toJSON());
    const totalPages = Math.ceil(totalItems / size);

    return {
      batches,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: size,
    };
  }

  async findWithFilters(
    filters: BatchFilters,
    page: number = 1,
    size: number = 10
  ): Promise<BatchSearchResult> {
    const collection = await this.getCollection();
    const skip = (page - 1) * size;

    // Construir selector basado en filtros
    const selector: any = {
      isDeleted: false,
    };

    if (filters.medicationId) {
      selector.medicationId = filters.medicationId;
    }

    if (filters.batchId) {
      selector.batchId = filters.batchId;
    }

    if (filters.supplier) {
      selector.supplier = filters.supplier;
    }

    if (filters.createdBy) {
      selector.createdBy = filters.createdBy;
    }

    // Filtros de fecha de vencimiento
    if (filters.expirationDateFrom || filters.expirationDateTo) {
      selector.expirationDate = {};
      if (filters.expirationDateFrom) {
        selector.expirationDate.$gte = filters.expirationDateFrom;
      }
      if (filters.expirationDateTo) {
        selector.expirationDate.$lte = filters.expirationDateTo;
      }
    }

    // Filtros de fecha de compra
    if (filters.purchaseDateFrom || filters.purchaseDateTo) {
      selector.purchaseDate = {};
      if (filters.purchaseDateFrom) {
        selector.purchaseDate.$gte = filters.purchaseDateFrom;
      }
      if (filters.purchaseDateTo) {
        selector.purchaseDate.$lte = filters.purchaseDateTo;
      }
    }

    // Filtros de cantidad
    if (
      filters.minQuantity !== undefined ||
      filters.maxQuantity !== undefined
    ) {
      selector.quantity = {};
      if (filters.minQuantity !== undefined) {
        selector.quantity.$gte = filters.minQuantity;
      }
      if (filters.maxQuantity !== undefined) {
        selector.quantity.$lte = filters.maxQuantity;
      }
    }

    // Filtros de precio
    if (
      filters.minPurchasePrice !== undefined ||
      filters.maxPurchasePrice !== undefined
    ) {
      selector.purchasePrice = {};
      if (filters.minPurchasePrice !== undefined) {
        selector.purchasePrice.$gte = filters.minPurchasePrice;
      }
      if (filters.maxPurchasePrice !== undefined) {
        selector.purchasePrice.$lte = filters.maxPurchasePrice;
      }
    }

    // Obtener total de elementos - usar find().length para selectores complejos
    let totalItems: number;
    const hasComplexSelector =
      (selector.expirationDate &&
        (selector.expirationDate.$gte || selector.expirationDate.$lte)) ||
      (selector.purchaseDate &&
        (selector.purchaseDate.$gte || selector.purchaseDate.$lte)) ||
      (selector.quantity &&
        (selector.quantity.$gte || selector.quantity.$lte)) ||
      (selector.purchasePrice &&
        (selector.purchasePrice.$gte || selector.purchasePrice.$lte));

    if (hasComplexSelector) {
      // Para selectores complejos con rangos, usar find().length para evitar QU14
      const allDocs = await collection.find({ selector }).exec();
      totalItems = allDocs.length;
    } else {
      // Para selectores simples, usar count() que es más eficiente
      totalItems = await collection.count({ selector }).exec();
    }

    // Obtener elementos paginados
    const docs = await collection
      .find({
        selector,
        sort: [{ expirationDate: "asc" }],
        skip,
        limit: size,
      })
      .exec();

    const batches = docs.map((doc: any) => doc.toJSON());
    const totalPages = Math.ceil(totalItems / size);

    // Filtrar por status si se especifica
    let filteredBatches = batches;
    if (filters.status) {
      const today = new Date();
      filteredBatches = batches.filter((batch: any) => {
        const expDate = new Date(batch.expirationDate);
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.status) {
          case "expired":
            return diffDays < 0;
          case "expiring":
            return diffDays >= 0 && diffDays <= 30;
          case "valid":
            return diffDays > 30;
          default:
            return true;
        }
      });
    }

    return {
      batches: filteredBatches,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: size,
    };
  }

  async findBatchesExpiringInDays(days: number): Promise<MedicationBatch[]> {
    const collection = await this.getCollection();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const docs = await collection
      .find({
        selector: {
          isDeleted: false,
          expirationDate: {
            $lte: futureDateStr,
          },
        },
        sort: [{ expirationDate: "asc" }],
      })
      .exec();

    return docs.map((doc: any) => doc.toJSON());
  }

  async findBatchesBySupplier(supplier: string): Promise<MedicationBatch[]> {
    const collection = await this.getCollection();
    const docs = await collection
      .find({
        selector: {
          isDeleted: false,
          supplier: supplier,
        },
        sort: [{ expirationDate: "asc" }],
      })
      .exec();

    return docs.map((doc: any) => doc.toJSON());
  }

  async searchByBatchId(batchId: string): Promise<MedicationBatch[]> {
    const collection = await this.getCollection();
    const searchTerm = batchId.toLowerCase();

    const docs = await collection
      .find({
        selector: {
          isDeleted: false,
          batchId: {
            $regex: searchTerm,
          },
        },
        sort: [{ expirationDate: "asc" }],
      })
      .exec();

    return docs.map((doc: any) => doc.toJSON());
  }

  async searchByBatchIdPaginated(
    batchId: string,
    page: number,
    size: number
  ): Promise<{
    batches: MedicationBatch[];
    totalItems: number;
    totalPages: number;
  }> {
    const collection = await this.getCollection();
    const searchTerm = batchId.toLowerCase();
    const skip = (page - 1) * size;

    // Obtener todos los resultados para contar el total
    const allDocs = await collection
      .find({
        selector: {
          isDeleted: false,
          batchId: {
            $regex: searchTerm,
          },
        },
        sort: [{ expirationDate: "asc" }],
      })
      .exec();

    const totalItems = allDocs.length;
    const totalPages = Math.ceil(totalItems / size);

    // Aplicar paginación
    const paginatedDocs = allDocs.slice(skip, skip + size);
    const batches = paginatedDocs.map((doc: any) => doc.toJSON());

    return {
      batches,
      totalItems,
      totalPages,
    };
  }

  async getTotalStockByMedicationId(medicationId: string): Promise<number> {
    const collection = await this.getCollection();
    const docs = await collection
      .find({
        selector: {
          medicationId,
          isDeleted: false,
        },
      })
      .exec();

    return docs.reduce(
      (total: number, doc: any) => total + doc.toJSON().quantity,
      0
    );
  }

  async getBatchCountByMedicationId(medicationId: string): Promise<number> {
    const collection = await this.getCollection();
    // Selector simple con índices optimizados, usar count() directamente
    return await collection
      .count({
        selector: {
          medicationId,
          isDeleted: false, // Usar false en lugar de { $ne: true }
        },
      })
      .exec();
  }

  async getStatistics(medicationId?: string): Promise<BatchStatistics> {
    const collection = await this.getCollection();
    const selector: any = { isDeleted: false };
    if (medicationId) {
      selector.medicationId = medicationId;
    }

    const docs = await collection.find({ selector }).exec();
    const batches = docs.map((doc: any) => doc.toJSON());

    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const stats: BatchStatistics = {
      totalBatches: batches.length,
      totalStock: batches.reduce(
        (sum: number, batch: any) => sum + batch.quantity,
        0
      ),
      batchesExpiringSoon: batches.filter((batch: any) => {
        const expDate = new Date(batch.expirationDate);
        return expDate <= thirtyDaysFromNow && expDate >= today;
      }).length,
      batchesExpired: batches.filter((batch: any) => {
        const expDate = new Date(batch.expirationDate);
        return expDate < today;
      }).length,
      averagePurchasePrice:
        batches.length > 0
          ? batches.reduce(
              (sum: number, batch: any) => sum + batch.purchasePrice,
              0
            ) / batches.length
          : 0,
      averageSellingPrice:
        batches.length > 0
          ? batches.reduce(
              (sum: number, batch: any) => sum + batch.sellingPrice,
              0
            ) / batches.length
          : 0,
      uniqueSuppliers: new Set(
        batches.map((batch: any) => batch.supplier).filter(Boolean)
      ).size,
    };

    return stats;
  }

  // 🆕 NUEVOS MÉTODOS PARA STOCK ACTIVO

  /**
   * Obtiene el stock total activo de un medicamento (solo lotes con quantity > 0 y no vencidos)
   */
  async getTotalActiveStockByMedicationId(
    medicationId: string
  ): Promise<number> {
    const collection = await this.getCollection();
    const today = new Date().toISOString().split("T")[0];

    const docs = await collection
      .find({
        selector: {
          medicationId,
          isDeleted: false,
          quantity: { $gt: 0 },
          expirationDate: { $gt: today },
        },
      })
      .exec();

    return docs.reduce(
      (total: number, doc: any) => total + doc.toJSON().quantity,
      0
    );
  }

  /**
   * Obtiene la cantidad de lotes activos de un medicamento
   */
  async getActiveBatchCountByMedicationId(
    medicationId: string
  ): Promise<number> {
    const collection = await this.getCollection();
    const today = new Date().toISOString().split("T")[0];

    // Usar find().length para selectores complejos
    const docs = await collection
      .find({
        selector: {
          medicationId,
          isDeleted: false,
          quantity: { $gt: 0 },
          expirationDate: { $gt: today },
        },
      })
      .exec();

    return docs.length;
  }

  /**
   * Obtiene todos los lotes activos de un medicamento
   */
  async findActiveBatchesByMedicationId(
    medicationId: string
  ): Promise<MedicationBatch[]> {
    const collection = await this.getCollection();
    const today = new Date().toISOString().split("T")[0];

    const docs = await collection
      .find({
        selector: {
          medicationId,
          isDeleted: false,
          quantity: { $gt: 0 },
          expirationDate: { $gt: today },
        },
        sort: [{ expirationDate: "asc" }], // Ordenar por fecha de vencimiento
      })
      .exec();

    return docs.map((doc: any) => doc.toJSON());
  }

  /**
   * Obtiene todos los lotes activos de un medicamento con paginación
   */
  async findActiveBatchesByMedicationIdPaginated(
    medicationId: string,
    page: number,
    size: number
  ): Promise<ItemsResponse<MedicationBatch>> {
    const collection = await this.getCollection();
    const today = new Date().toISOString().split("T")[0];

    // Calculate skip value for pagination
    const skip = (page - 1) * size;

    const docs = await collection
      .find({
        selector: {
          medicationId,
          isDeleted: false,
          quantity: { $gt: 0 },
          expirationDate: { $gt: today },
        },
        sort: [{ expirationDate: "asc" }],
        skip,
        limit: size,
      })
      .exec();

    const totalDocs = await collection
      .count({
        selector: {
          medicationId,
          isDeleted: false,
          quantity: { $gt: 0 },
          expirationDate: { $gt: today },
        },
      })
      .exec();

    return {
      items: docs.map((doc: any) => doc.toJSON() as MedicationBatch),
      totalItems: totalDocs,
      size: totalDocs,
      totalPages: Math.ceil(totalDocs / size),
      page,
    };
  }

  /**
   * Obtiene el lote activo más próximo a vencer de un medicamento
   */
  async getOldestActiveBatchByMedicationId(
    medicationId: string
  ): Promise<MedicationBatch | null> {
    const collection = await this.getCollection();
    const today = new Date().toISOString().split("T")[0];

    const doc = await collection
      .findOne({
        selector: {
          medicationId,
          isDeleted: false,
          quantity: { $gt: 0 },
          expirationDate: { $gt: today },
        },
        sort: [{ expirationDate: "asc" }], // El más próximo a vencer primero
      })
      .exec();

    return doc ? doc.toJSON() : null;
  }

  /**
   * Obtiene IDs de medicamentos que tienen stock activo
   */
  async findMedicationIdsWithActiveStock(): Promise<string[]> {
    const collection = await this.getCollection();
    const today = new Date().toISOString().split("T")[0];

    const docs = await collection
      .find({
        selector: {
          isDeleted: false,
          quantity: { $gt: 0 },
          expirationDate: { $gt: today },
        },
      })
      .exec();

    // Agrupar por medicationId y eliminar duplicados
    const medicationIds = new Set(
      docs.map((doc: any) => doc.toJSON().medicationId)
    );
    return Array.from(medicationIds);
  }

  async batchIdExistsForMedication(
    medicationId: string,
    batchId: string,
    excludeId?: string
  ): Promise<boolean> {
    const collection = await this.getCollection();
    const selector: any = {
      medicationId,
      batchId,
      isDeleted: false,
    };

    if (excludeId) {
      selector.id = { $ne: excludeId };
    }

    const doc = await collection.findOne({ selector }).exec();
    return !!doc;
  }

  /**
   * 🆕 Obtiene el conteo de lotes próximos a vencer y vencidos de manera optimizada
   * @param daysToExpire Número de días para considerar como "próximo a vencer"
   * @returns Objeto con conteos de lotes próximos a vencer, vencidos y total
   */
  async getExpiringAndExpiredBatchesCount(daysToExpire: number): Promise<{
    expiring: number;
    expired: number;
    total: number;
  }> {
    const collection = await this.getCollection();
    const now = new Date();
    const expiringThreshold = new Date();
    expiringThreshold.setDate(now.getDate() + daysToExpire);

    // Convertir fechas a strings en formato ISO para comparación
    const nowISODate = now.toISOString().split('T')[0]; // Solo la fecha, sin tiempo
    const expiringISODate = expiringThreshold.toISOString().split('T')[0];

    // Usar una sola consulta find con el índice ['isDeleted', 'expirationDate'] 
    // y procesar en memoria para evitar el slow count
    const docs = await collection
      .find({
        selector: {
          isDeleted: false,
          expirationDate: { $lte: expiringISODate } // Todos los lotes hasta el umbral
        },
        // Este selector coincide con el índice ['isDeleted', 'expirationDate']
      })
      .exec();

    // Procesar en memoria (más eficiente que múltiples count queries)
    let expiredCount = 0;
    let expiringCount = 0;

    docs.forEach((doc: any) => {
      const batch = doc.toJSON();
      const expirationDate = batch.expirationDate;
      
      if (expirationDate <= nowISODate) {
        expiredCount++;
      } else if (expirationDate <= expiringISODate) {
        expiringCount++;
      }
    });

    const total = expiredCount + expiringCount;

    return {
      expiring: expiringCount,
      expired: expiredCount,
      total,
    };
  }

  /**
   * 🆕 Obtiene el total de lotes activos en toda la base de datos
   * @returns Número total de lotes no eliminados
   */
  async getTotalActiveBatchesCount(): Promise<number> {
    const collection = await this.getCollection();
    
    // Usar el índice simple 'isDeleted' para una consulta optimizada
    const count = await collection
      .count({
        selector: {
          isDeleted: false
        },
      })
      .exec();

    return count;
  }
}

/**
 * Repositorio para Firestore (placeholder - implementar según necesidades)
 */
export class FirestoreMedicationBatchRepository
  implements IMedicationBatchRepository
{
  findActiveBatchesByMedicationIdPaginated(_medicationId: string, _page: number, _size: number): Promise<ItemsResponse<MedicationBatch>> {
    throw new Error("Method not implemented.");
  }
  // TODO: Implementar métodos para Firestore si es necesario
  async create(_data: CreateMedicationBatchData): Promise<MedicationBatch> {
    throw new Error("Firestore implementation not yet available");
  }

  async findById(_id: string): Promise<MedicationBatch | null> {
    throw new Error("Firestore implementation not yet available");
  }

  async update(
    _id: string,
    _data: UpdateMedicationBatchData
  ): Promise<MedicationBatch> {
    throw new Error("Firestore implementation not yet available");
  }

  async delete(_id: string): Promise<void> {
    throw new Error("Firestore implementation not yet available");
  }

  async findByMedicationId(
    _medicationId: string,
    _page?: number,
    _size?: number
  ): Promise<BatchSearchResult> {
    throw new Error("Firestore implementation not yet available");
  }

  async findWithFilters(
    _filters: BatchFilters,
    _page?: number,
    _size?: number
  ): Promise<BatchSearchResult> {
    throw new Error("Firestore implementation not yet available");
  }

  async findBatchesExpiringInDays(_days: number): Promise<MedicationBatch[]> {
    throw new Error("Firestore implementation not yet available");
  }

  async findBatchesBySupplier(_supplier: string): Promise<MedicationBatch[]> {
    throw new Error("Firestore implementation not yet available");
  }

  async searchByBatchId(_batchId: string): Promise<MedicationBatch[]> {
    throw new Error("Firestore implementation not yet available");
  }

  async searchByBatchIdPaginated(
    _batchId: string,
    _page: number,
    _size: number
  ): Promise<{
    batches: MedicationBatch[];
    totalItems: number;
    totalPages: number;
  }> {
    throw new Error("Firestore implementation not yet available");
  }

  async getTotalStockByMedicationId(_medicationId: string): Promise<number> {
    throw new Error("Firestore implementation not yet available");
  }

  async getBatchCountByMedicationId(_medicationId: string): Promise<number> {
    throw new Error("Firestore implementation not yet available");
  }

  async getStatistics(_medicationId?: string): Promise<BatchStatistics> {
    throw new Error("Firestore implementation not yet available");
  }

  async batchIdExistsForMedication(
    _medicationId: string,
    _batchId: string,
    _excludeId?: string
  ): Promise<boolean> {
    throw new Error("Firestore implementation not yet available");
  }

  // 🆕 NUEVOS MÉTODOS PARA STOCK ACTIVO - Firestore placeholders

  async getTotalActiveStockByMedicationId(
    _medicationId: string
  ): Promise<number> {
    throw new Error("Firestore implementation not yet available");
  }

  async getActiveBatchCountByMedicationId(
    _medicationId: string
  ): Promise<number> {
    throw new Error("Firestore implementation not yet available");
  }

  async findActiveBatchesByMedicationId(
    _medicationId: string
  ): Promise<MedicationBatch[]> {
    throw new Error("Firestore implementation not yet available");
  }

  async getOldestActiveBatchByMedicationId(
    _medicationId: string
  ): Promise<MedicationBatch | null> {
    throw new Error("Firestore implementation not yet available");
  }

  async findMedicationIdsWithActiveStock(): Promise<string[]> {
    throw new Error("Firestore implementation not yet available");
  }

  async getExpiringAndExpiredBatchesCount(_daysToExpire: number): Promise<{
    expiring: number;
    expired: number;
    total: number;
  }> {
    throw new Error("Firestore implementation not yet available");
  }

  async getTotalActiveBatchesCount(): Promise<number> {
    throw new Error("Firestore implementation not yet available");
  }
}

export const LocalMedicationBatchDb = new LocalMedicationBatchRepository();
export const FirestoreMedicationBatchDb =
  new FirestoreMedicationBatchRepository();

export const getMedicationBatchRepository = (): IMedicationBatchRepository => {
  return config.APP_MODE === "local"
    ? LocalMedicationBatchDb
    : FirestoreMedicationBatchDb;
};
