import { useEffect } from "react";
import { Toaster } from "sonner";
import { AppRoutes } from "./routes/AppRoutes";
import { useAppDispatch } from "./shared/store/hooks";
import { loadUserFromStorage } from "./shared/store/authSlice";
import { initDatabase } from "./shared/db/database";
import { startAllReplications } from "./shared/db/replication/startReplications";
import { verifyAndRunMigrations } from "./shared/db/migration/migrationHelper";
import { syncService } from "./shared/services/SyncService";
import { migrateExistingDocuments } from "./shared/db/migration/timestampMigration";
// Import helper para debugging en desarrollo
import "./shared/db/replication/syncTestHelper";

// Agregar funciones de debug globales para consola
if (typeof window !== 'undefined') {
  // Función para obtener todos los documentos de una colección
  (window as any).getLocalDocs = async function(collectionName: string) {
    try {
      if (!(window as any).db || !(window as any).db[collectionName]) {
        console.error(`❌ Colección '${collectionName}' no existe`);
        console.log('📋 Colecciones disponibles:', Object.keys((window as any).db || {}));
        return;
      }
      
      const docs = await (window as any).db[collectionName].find().exec();
      console.log(`📊 ${collectionName}: ${docs.length} documentos encontrados`);
      
      docs.forEach((doc: any, index: number) => {
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

  // Función para contar documentos por colección
  (window as any).countLocalDocs = async function() {
    try {
      if (!(window as any).db) {
        console.error('❌ Base de datos no disponible');
        return;
      }
      
      console.log('📊 Conteo de documentos por colección:');
      const collections = Object.keys((window as any).db);
      
      for (const collectionName of collections) {
        if (typeof (window as any).db[collectionName].find === 'function') {
          const count = await (window as any).db[collectionName].count().exec();
          console.log(`  📁 ${collectionName}: ${count} documentos`);
        }
      }
    } catch (error) {
      console.error('❌ Error contando documentos:', error);
    }
  };

  // Función para verificar estado de sincronización
  (window as any).checkSyncStatus = async function(collectionName: string) {
    try {
      if (!(window as any).db || !(window as any).db[collectionName]) {
        console.error(`❌ Colección '${collectionName}' no existe`);
        return;
      }
      
      const allDocs = await (window as any).db[collectionName].find().exec();
      const syncedDocs = await (window as any).db[collectionName].find().where('sincronized').eq(true).exec();
      const unsyncedDocs = await (window as any).db[collectionName].find().where('sincronized').eq(false).exec();
      
      console.log(`🔄 Estado de sincronización de ${collectionName}:`);
      console.log(`  📄 Total: ${allDocs.length}`);
      console.log(`  ✅ Sincronizados: ${syncedDocs.length}`);
      console.log(`  ⏳ No sincronizados: ${unsyncedDocs.length}`);
      
      if (unsyncedDocs.length > 0) {
        console.log('📋 Documentos no sincronizados:');
        unsyncedDocs.forEach((doc: any) => {
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

}

function App() {
  const dispatch = useAppDispatch();


  
  useEffect(() => {
    const init = async () => {
      try {
        console.log("🚀 Inicializando aplicación...");
        const db = await initDatabase();
        
        // Verificar y ejecutar migraciones
        await verifyAndRunMigrations(db);
        //await manualMigrationIfNeeded(db);
        
        // Migrar timestamps en Firestore (solo una vez)
        const migrationKey = 'timestamp_migration_completed';
        const migrationCompleted = localStorage.getItem(migrationKey);
        if (!migrationCompleted) {
          console.log('🔄 Ejecutando migración de timestamps...');
          await migrateExistingDocuments();
          localStorage.setItem(migrationKey, 'true');
        }
        
        // Inicializar servicio de sincronización
        await syncService.initialize();
        
        // Iniciar replicaciones automáticas
        startAllReplications(db);
        
        console.log("✅ Aplicación inicializada correctamente");
      } catch (error) {
        console.error("❌ Error inicializando aplicación:", error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // Cargar usuario del localStorage al iniciar la app
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  return (
    <div>
      <AppRoutes />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </div>
  );
}

export default App;
