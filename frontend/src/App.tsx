import { useEffect } from "react";
import { Toaster } from "sonner";
import { AppRoutes } from "./routes/AppRoutes";
import { useAppDispatch } from "./shared/store/hooks";
import { loadUserFromStorage } from "./shared/store/authSlice";
import { initDatabase } from "./shared/db/database";
import { startAllReplications } from "./shared/db/replication/startReplications";
import { verifyAndRunMigrations, manualMigrationIfNeeded } from "./shared/db/migration/migrationHelper";
import { syncService } from "./shared/services/SyncService";

function App() {
  const dispatch = useAppDispatch();


  
  useEffect(() => {
    const init = async () => {
      try {
        console.log("🚀 Inicializando aplicación...");
        const db = await initDatabase();
        
        // Verificar y ejecutar migraciones
        await verifyAndRunMigrations(db);
        await manualMigrationIfNeeded(db);
        
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
