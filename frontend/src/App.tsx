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
