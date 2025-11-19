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
   * sincronized se establece en false inicialmente y será true cuando venga desde Firestore
   */
  protected async createWithPriority(data: Omit<T, 'id'> & { id: string }): Promise<T> {
    const collection = await this.getCollection();
    const now = new Date().toISOString();
    
    const dataWithTimestamps = {
      ...data,
      createdAt: now,
      updatedAt: now,
      _lastModifiedAt: now, // Timestamp para conflict resolution
      _deleted: false, // Campo estándar de RxDB
      sincronized: false, // Flag para UI: false hasta que se confirme en Firestore
    };
    
    console.log(`📝 BaseRepository: Creando documento con timestamps`, {
      id: dataWithTimestamps.id,
      updatedAt: dataWithTimestamps.updatedAt,
      _lastModifiedAt: dataWithTimestamps._lastModifiedAt,
      _deleted: dataWithTimestamps._deleted
    });
    
    const doc = await collection.insert(dataWithTimestamps as any);
    return JSON.parse(JSON.stringify(doc.toJSON())) as T;
  }

  /**
   * Actualizar un documento
   * RxDB detecta automáticamente los cambios y los sincroniza
   * sincronized se marca false para indicar que hay cambios pendientes
   */
  protected async updateWithPriority(id: string, data: Partial<T>): Promise<T> {
    console.log(`🔄 BaseRepository: Iniciando actualización con prioridad para documento ${id}`, data);
    
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    if (!doc) throw new Error('Document not found');
    
    console.log(`📋 BaseRepository: Documento encontrado`, {
      id: doc.id,
      currentUpdatedAt: (doc as any).updatedAt,
      current_lastModifiedAt: (doc as any)._lastModifiedAt
    });
    
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
      _lastModifiedAt: now, // Timestamp para conflict resolution
      _forceLocalPriority: true, // Flag para forzar prioridad local en conflictos
      sincronized: false, // Flag para UI: indica cambios pendientes de sincronizar
    };
    
    console.log(`📤 BaseRepository: Aplicando actualización a RxDB`, {
      id,
      newUpdatedAt: updateData.updatedAt,
      new_lastModifiedAt: updateData._lastModifiedAt,
      _forceLocalPriority: updateData._forceLocalPriority
    });
    
    await doc.patch(updateData as any);
    
    const freshDoc = await collection.findOne(id).exec();
    const result = JSON.parse(JSON.stringify(freshDoc!.toJSON())) as T;
    
    console.log(`✅ BaseRepository: Documento actualizado exitosamente`, {
      id: result.id,
      finalUpdatedAt: (result as any).updatedAt,
      final_lastModifiedAt: (result as any)._lastModifiedAt
    });
    
    return result;
  }

  /**
   * Soft delete
   * RxDB detecta automáticamente los cambios y los sincroniza
   * sincronized se marca false para indicar que hay cambios pendientes
   */
  protected async deleteWithPriority(id: string): Promise<boolean> {
    console.log(`🗑️ BaseRepository: Iniciando soft delete para documento ${id}`);
    
    const collection = await this.getCollection();
    const doc = await collection.findOne(id).exec();
    if (!doc) return false;
    
    const now = new Date().toISOString();
    const deleteData = {
      _deleted: true, // Campo estándar de RxDB para soft deletes
      isDeleted: true, // Campo de lógica de negocio (compatibilidad)
      deletedAt: now,
      updatedAt: now,
      _lastModifiedAt: now, // Timestamp para conflict resolution
      _forceLocalPriority: true, // Flag para forzar prioridad local
      sincronized: false, // Flag para UI: indica cambios pendientes de sincronizar
    };
    
    console.log(`🗑️ BaseRepository: Aplicando soft delete a RxDB`, { id, _deleted: true, isDeleted: true });
    
    await doc.patch(deleteData as any);
    
    console.log(`✅ BaseRepository: Soft delete aplicado exitosamente`, { id });
    
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
    
    // Buscar por ambos campos para compatibilidad
    const selector = { 
      _deleted: { $eq: false },
      isDeleted: { $eq: false }
    };
    
    const docs = await collection.find({
      selector: selector as any
    }).exec();
    return docs.map((doc: any) => JSON.parse(JSON.stringify(doc.toJSON())) as T);
  }
}
