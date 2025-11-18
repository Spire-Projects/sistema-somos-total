import type { RxCollection } from 'rxdb';

/**
 * Clase base optimizada para repositorios
 * Sin flags temporales ni bloqueos manuales
 * Confía en el conflict handler de RxDB
 */
export abstract class BaseRepository<T extends { [key: string]: any }> {
  protected abstract getCollection(): Promise<RxCollection<T>>;

  /**
   * Crear un documento con timestamps
   */
  protected async createWithPriority(data: Omit<T, 'id'> & { id: string }): Promise<T> {
    const collection = await this.getCollection();
    const now = new Date().toISOString();
    
    const dataWithTimestamps = {
      ...data,
      createdAt: now,
      updatedAt: now,
      sincronized: false,
    };
    
    const doc = await collection.insert(dataWithTimestamps as any);
    return JSON.parse(JSON.stringify(doc.toJSON())) as T;
  }

  /**
   * Actualizar un documento
   * El conflict handler se encarga de la priorización automáticamente
   */
  protected async updateWithPriority(id: string, data: Partial<T>): Promise<T> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    if (!doc) throw new Error('Document not found');
    
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
      sincronized: false,
    };
    
    await doc.patch(updateData as any);
    
    const freshDoc = await collection.findOne(id).exec();
    return JSON.parse(JSON.stringify(freshDoc!.toJSON())) as T;
  }

  /**
   * Soft delete
   */
  protected async deleteWithPriority(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    if (!doc) return false;
    
    const now = new Date().toISOString();
    const deleteData = {
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
      sincronized: false,
    };
    
    await doc.patch(deleteData as any);
    return true;
  }

  /**
   * Buscar por ID
   */
  protected async findById(id: string): Promise<T | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as T : null;
  }

  /**
   * Buscar todos los no eliminados
   */
  protected async findAll(): Promise<T[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({
      selector: { isDeleted: { $eq: false } } as any
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as T);
  }
}
