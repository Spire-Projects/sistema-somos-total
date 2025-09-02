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
          _serverUpdatedAt: docData._serverUpdatedAt,
          sincronized: docData.sincronized,
          // Incluir algunos campos de datos para verificar cambios
          name: docData.name,
          email: docData.email
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
              _forceLocalPriority: data._forceLocalPriority,
              name: data.name || data.title || 'sin-nombre'
            };
          });
        
        console.log(`⏳ Documentos pendientes de sincronización (primeros 5):`, unsynced);
      }
      
      // Mostrar documentos recientes para verificar actividad
      const recentDocs = allDocs
        .filter((doc: any) => {
          const updatedAt = new Date(doc.updatedAt || doc.createdAt);
          const now = new Date();
          const minutesAgo = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
          return minutesAgo < 30; // Últimos 30 minutos
        })
        .slice(0, 3)
        .map((doc: any) => {
          const data = doc.toJSON();
          return {
            id: data.id,
            updatedAt: data.updatedAt,
            name: data.name || data.title || 'sin-nombre',
            minutesAgo: Math.round((new Date().getTime() - new Date(data.updatedAt).getTime()) / (1000 * 60))
          };
        });
        
      if (recentDocs.length > 0) {
        console.log(`🕐 Actividad reciente (últimos 30 min):`, recentDocs);
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

export const testReplicationStates = async () => {
  console.log(`🔍 Verificando estados de replicación activos...`);
  
  try {
    const db = await initDatabase();
    const collections = ['clients', 'users', 'medications', 'medication_batches'];
    
    for (const collectionName of collections) {
      const collection = (db as any)[collectionName];
      if (collection) {
        // Verificar si hay documentos con diferentes estados de sync
        const docs = await collection.find().limit(10).exec();
        const stats = {
          total: docs.length,
          withServerTimestamp: docs.filter((d: any) => d._serverUpdatedAt).length,
          withLastSync: docs.filter((d: any) => d._lastSyncedAt).length,
          sincronized: docs.filter((d: any) => d.sincronized === true).length,
          unsyncronized: docs.filter((d: any) => d.sincronized === false).length
        };
        
        console.log(`📊 ${collectionName}:`, stats);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error verificando estados de replicación:`, error);
  }
};

export const simulateRemoteUpdate = async (collectionName: string, documentId: string, updateData: any) => {
  console.log(`🌐 Simulando actualización remota para ${documentId} en ${collectionName}`);
  
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
    
    // Simular que viene de Firestore con serverTimestamp
    const now = new Date().toISOString();
    const simulatedRemoteData = {
      ...updateData,
      updatedAt: now,
      _lastModifiedAt: now,
      _serverUpdatedAt: now,
      _lastSyncedAt: now,
      sincronized: true,
      // NO incluir _forceLocalPriority para simular datos remotos
    };
    
    console.log(`🌐 Aplicando datos simulados:`, simulatedRemoteData);
    
    await doc.patch(simulatedRemoteData);
    
    console.log(`✅ Actualización remota simulada aplicada`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error simulando actualización remota:`, error);
    return false;
  }
};

// Función para probar en la consola del navegador
(window as any).syncTestHelper = {
  testReplicationFlow,
  forceDocumentSync,
  testReplicationStates,
  simulateRemoteUpdate
};

console.log("🛠️ SyncTestHelper cargado. Funciones disponibles:");
console.log("- syncTestHelper.testReplicationFlow('clients')");
console.log("- syncTestHelper.testReplicationStates()");
console.log("- syncTestHelper.simulateRemoteUpdate('clients', 'doc-id', {name: 'nuevo nombre'})");
console.log("- syncTestHelper.forceDocumentSync('clients', 'doc-id')");
