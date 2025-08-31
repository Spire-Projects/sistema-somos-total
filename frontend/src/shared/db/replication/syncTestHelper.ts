/**
 * Helper para diagnosticar problemas de sincronización
 */

import { initDatabase } from "../database";

export const testReplicationFlow = async (collectionName: string, documentId?: string) => {
  console.log(`🔍 Iniciando diagnóstico de replicación para ${collectionName}`);
  
  try {
    const db = await initDatabase();
    const collection = (db as any)[collectionName];
    
    if (!collection) {
      console.error(`❌ Colección ${collectionName} no encontrada`);
      return;
    }
    
    // Si se especifica un documento, mostrar su estado
    if (documentId) {
      const doc = await collection.findOne(documentId).exec();
      if (doc) {
        const docData = doc.toJSON();
        console.log(`📋 Estado actual del documento ${documentId}:`, {
          id: docData.id,
          updatedAt: docData.updatedAt,
          _lastModifiedAt: docData._lastModifiedAt,
          _lastSyncedAt: docData._lastSyncedAt,
          _forceLocalPriority: docData._forceLocalPriority,
          sincronized: docData.sincronized
        });
      } else {
        console.log(`❌ Documento ${documentId} no encontrado en ${collectionName}`);
      }
    } else {
      // Mostrar estadísticas generales
      const allDocs = await collection.find().exec();
      const total = allDocs.length;
      const syncedDocs = allDocs.filter((doc: any) => doc.sincronized === true).length;
      const unsyncedDocs = total - syncedDocs;
      
      console.log(`📊 Estadísticas de sincronización para ${collectionName}:`, {
        total,
        sincronizados: syncedDocs,
        pendientes: unsyncedDocs,
        porcentaje: total > 0 ? Math.round((syncedDocs / total) * 100) : 0
      });
      
      // Mostrar documentos no sincronizados
      if (unsyncedDocs > 0) {
        const unsynced = allDocs
          .filter((doc: any) => doc.sincronized !== true)
          .slice(0, 5) // Solo los primeros 5
          .map((doc: any) => {
            const data = doc.toJSON();
            return {
              id: data.id,
              updatedAt: data.updatedAt,
              _forceLocalPriority: data._forceLocalPriority
            };
          });
        
        console.log(`⏳ Documentos pendientes de sincronización (primeros 5):`, unsynced);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error en diagnóstico de replicación:`, error);
  }
};

export const forceDocumentSync = async (collectionName: string, documentId: string) => {
  console.log(`🔄 Forzando sincronización de documento ${documentId} en ${collectionName}`);
  
  try {
    const db = await initDatabase();
    const collection = (db as any)[collectionName];
    
    if (!collection) {
      console.error(`❌ Colección ${collectionName} no encontrada`);
      return false;
    }
    
    const doc = await collection.findOne(documentId).exec();
    if (!doc) {
      console.error(`❌ Documento ${documentId} no encontrado`);
      return false;
    }
    
    // Forzar actualización con timestamp actual y prioridad
    const now = new Date().toISOString();
    await doc.patch({
      updatedAt: now,
      _lastModifiedAt: now,
      _forceLocalPriority: true,
      sincronized: false
    });
    
    console.log(`✅ Documento ${documentId} marcado para sincronización forzada`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error forzando sincronización:`, error);
    return false;
  }
};

// Función para probar en la consola del navegador
(window as any).syncTestHelper = {
  testReplicationFlow,
  forceDocumentSync
};

console.log("🛠️ SyncTestHelper cargado. Usa syncTestHelper.testReplicationFlow('clients') en la consola");
