// Funciones de debug para RxDB en consola del navegador
// Ejecuta estas funciones en las Dev Tools (F12 > Console)

console.log('🔧 Funciones de debug RxDB cargadas');

// Función para obtener todos los documentos de una colección
window.getLocalDocs = async function(collectionName) {
  try {
    if (!window.db || !window.db[collectionName]) {
      console.error(`❌ Colección '${collectionName}' no existe`);
      console.log('📋 Colecciones disponibles:', Object.keys(window.db || {}));
      return;
    }
    
    const docs = await window.db[collectionName].find().exec();
    console.log(`📊 ${collectionName}: ${docs.length} documentos encontrados`);
    
    docs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.id}:`, {
        name: doc.name || doc.title || 'N/A',
        updatedAt: doc.updatedAt,
        sincronized: doc.sincronized,
        _lastSyncedAt: doc._lastSyncedAt,
        _rev: doc._rev
      });
    });
    
    return docs;
  } catch (error) {
    console.error(`❌ Error obteniendo documentos de ${collectionName}:`, error);
  }
};

// Función para obtener un documento específico por ID
window.getLocalDoc = async function(collectionName, docId) {
  try {
    if (!window.db || !window.db[collectionName]) {
      console.error(`❌ Colección '${collectionName}' no existe`);
      return;
    }
    
    const doc = await window.db[collectionName].findOne(docId).exec();
    if (doc) {
      console.log(`📄 Documento ${docId}:`, doc.toJSON());
      return doc;
    } else {
      console.log(`❌ Documento ${docId} no encontrado en ${collectionName}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error obteniendo documento ${docId}:`, error);
  }
};

// Función para contar documentos por colección
window.countLocalDocs = async function() {
  try {
    if (!window.db) {
      console.error('❌ Base de datos no disponible');
      return;
    }
    
    console.log('📊 Conteo de documentos por colección:');
    const collections = Object.keys(window.db);
    
    for (const collectionName of collections) {
      if (typeof window.db[collectionName].find === 'function') {
        const count = await window.db[collectionName].count().exec();
        console.log(`  📁 ${collectionName}: ${count} documentos`);
      }
    }
  } catch (error) {
    console.error('❌ Error contando documentos:', error);
  }
};

// Función para verificar estado de sincronización
window.checkSyncStatus = async function(collectionName) {
  try {
    if (!window.db || !window.db[collectionName]) {
      console.error(`❌ Colección '${collectionName}' no existe`);
      return;
    }
    
    const allDocs = await window.db[collectionName].find().exec();
    const syncedDocs = await window.db[collectionName].find().where('sincronized').eq(true).exec();
    const unsyncedDocs = await window.db[collectionName].find().where('sincronized').eq(false).exec();
    
    console.log(`🔄 Estado de sincronización de ${collectionName}:`);
    console.log(`  📄 Total: ${allDocs.length}`);
    console.log(`  ✅ Sincronizados: ${syncedDocs.length}`);
    console.log(`  ⏳ No sincronizados: ${unsyncedDocs.length}`);
    
    if (unsyncedDocs.length > 0) {
      console.log('📋 Documentos no sincronizados:');
      unsyncedDocs.forEach(doc => {
        console.log(`  - ${doc.id}: ${doc.name || doc.title || 'N/A'}`);
      });
    }
    
    return {
      total: allDocs.length,
      synced: syncedDocs.length,
      unsynced: unsyncedDocs.length,
      unsyncedDocs: unsyncedDocs
    };
  } catch (error) {
    console.error(`❌ Error verificando estado de sync:`, error);
  }
};

// Función para buscar documentos por criterio
window.searchLocalDocs = async function(collectionName, field, value) {
  try {
    if (!window.db || !window.db[collectionName]) {
      console.error(`❌ Colección '${collectionName}' no existe`);
      return;
    }
    
    const docs = await window.db[collectionName].find().where(field).eq(value).exec();
    console.log(`🔍 Búsqueda en ${collectionName} donde ${field} = ${value}:`);
    console.log(`📄 ${docs.length} documentos encontrados`);
    
    docs.forEach(doc => {
      console.log(`  - ${doc.id}:`, doc.toJSON());
    });
    
    return docs;
  } catch (error) {
    console.error(`❌ Error en búsqueda:`, error);
  }
};

// Función para verificar el esquema de una colección
window.getCollectionSchema = function(collectionName) {
  try {
    if (!window.db || !window.db[collectionName]) {
      console.error(`❌ Colección '${collectionName}' no existe`);
      return;
    }
    
    const schema = window.db[collectionName].schema;
    console.log(`📋 Esquema de ${collectionName}:`, schema);
    return schema;
  } catch (error) {
    console.error(`❌ Error obteniendo esquema:`, error);
  }
};

// Función para verificar las replicaciones activas
window.checkReplications = function() {
  try {
    if (!window.replications) {
      console.error('❌ No hay replicaciones disponibles');
      return;
    }
    
    console.log('🔄 Estado de replicaciones:');
    Object.entries(window.replications).forEach(([name, replication]) => {
      if (replication) {
        console.log(`  📁 ${name}:`);
        console.log(`    🔄 Activa: ${replication.active}` || 'N/A');
        console.log(`    ❌ Errores: ${replication.error || 'Ninguno'}`);
      }
    });
  } catch (error) {
    console.error('❌ Error verificando replicaciones:', error);
  }
};

console.log(`
🔧 Funciones disponibles:
- getLocalDocs('users') - Ver todos los documentos de una colección
- getLocalDoc('users', 'user-id') - Ver un documento específico
- countLocalDocs() - Contar documentos por colección
- checkSyncStatus('users') - Verificar estado de sincronización
- searchLocalDocs('users', 'email', 'test@example.com') - Buscar documentos
- getCollectionSchema('users') - Ver esquema de colección
- checkReplications() - Estado de replicaciones

📝 Ejemplos de uso:
await getLocalDocs('users');
await checkSyncStatus('users');
await countLocalDocs();
`);
