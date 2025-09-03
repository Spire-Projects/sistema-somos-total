import type { RxCollection } from 'rxdb';
import { createDocumentWithTimestamps } from '../replication/updateHelper';

/**
 * Clase base para repositorios que maneja automáticamente la sincronización con prioridad
 */
export abstract class BaseRepository<T extends { [key: string]: any }> {
  protected abstract getCollection(): Promise<RxCollection<T>>;

  /**
   * Crear un documento con timestamps correctos para sincronización
   */
  protected async createWithPriority(data: Omit<T, 'id'> & { id: string }): Promise<T> {
    const collection = await this.getCollection();
    const dataWithTimestamps = createDocumentWithTimestamps(data as unknown as T);
    const doc = await collection.insert(dataWithTimestamps as any);
    return JSON.parse(JSON.stringify(doc.toJSON())) as T;
  }

  /**
   * Actualizar un documento con prioridad en la sincronización
   */
  protected async updateWithPriority(id: string, data: Partial<T>): Promise<T> {
    console.log(`🔄 BaseRepository: Iniciando actualización con prioridad para documento ${id}`, data);
    
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    if (!doc) throw new Error('Document not found');
    
    console.log(`📋 BaseRepository: Documento encontrado`, {
      id: doc.id,
      currentUpdatedAt: (doc as any).updatedAt
    });
    
    // Usar timestamp actual en lugar de tiempo futuro para evitar problemas de sincronización
    const now = new Date().toISOString();
    
    const updateData = {
      ...data,
      updatedAt: now,
      _lastModifiedAt: now,
      _forceLocalPriority: true,
      sincronized: false
    };
    
    console.log(`📤 BaseRepository: Aplicando actualización a RxDB`, {
      id,
      newUpdatedAt: updateData.updatedAt,
      _lastModifiedAt: updateData._lastModifiedAt
    });
    
    // Aplicar los cambios usando el método patch de RxDB
    await doc.patch(updateData as any);
    
    // Obtener el documento actualizado
    const freshDoc = await collection.findOne(id).exec();
    const result = JSON.parse(JSON.stringify(freshDoc!.toJSON())) as T;
    
    console.log(`✅ BaseRepository: Documento actualizado exitosamente`, {
      id: result.id,
      finalUpdatedAt: (result as any).updatedAt,
      _lastModifiedAt: (result as any)._lastModifiedAt
    });
    
    return result;
  }

  /**
   * Soft delete con prioridad en la sincronización
   */
  protected async deleteWithPriority(id: string): Promise<boolean> {
    console.log(`🗑️ BaseRepository: Iniciando soft delete para documento ${id}`);
    
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    if (!doc) return false;
    
    // Usar timestamp actual en lugar de tiempo futuro
    const now = new Date().toISOString();
    
    // Usar _deleted que es el campo estándar de RxDB para soft deletes
    const deleteData = {
      _deleted: true,
      deletedAt: now,
      updatedAt: now,
      _lastModifiedAt: now,
      _forceLocalPriority: true,
      sincronized: false
    };
    
    console.log(`🗑️ BaseRepository: Aplicando soft delete a RxDB`, { id });
    
    // Aplicar los cambios usando el método patch de RxDB
    await doc.patch(deleteData as any);
    
    console.log(`✅ BaseRepository: Soft delete aplicado exitosamente`, { id });
    
    return true;
  }

  /**
   * Buscar un documento por ID
   */
  protected async findById(id: string): Promise<T | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    return doc ? JSON.parse(JSON.stringify(doc.toJSON())) as T : null;
  }

  /**
   * Buscar todos los documentos no eliminados
   */
  protected async findAll(): Promise<T[]> {
    const collection = await this.getCollection();
    
    // Usar _deleted que es el campo estándar de RxDB para soft deletes
    const selector = { _deleted: { $eq: false } };
    
    const docs = await collection.find({
      selector: selector as any
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as T);
  }
}
