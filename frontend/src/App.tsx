import { useEffect, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import { AppRoutes } from "./routes/AppRoutes";
import { useAppDispatch, useAppSelector } from "./shared/store/hooks";
import {
  loadAndValidateUser,
  validateUserFromDB,
  loadUserFromStorage,
} from "./shared/store/authSlice";
import { initDatabase } from "./shared/db/database";
import {
  startAllReplications,
  startDebugReplication,
} from "./shared/db/replication/startReplications";

import { syncService } from "./shared/services/SyncService";

function App() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isValidating } = useAppSelector(
    (state) => state.auth
  );
  const isInitialized = useRef(false);
  const lastValidationTime = useRef<number>(0);
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible" && isAuthenticated && user) {
      const now = Date.now();
      if (now - lastValidationTime.current > 20000) {
        console.log("🔍 Validando usuario al regresar a la pestaña...");
        dispatch(validateUserFromDB(user.id));
        lastValidationTime.current = now;
      }
    }
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    const init = async () => {
      try {
        await syncService.initialize();

        await startDebugReplication();

        // Inicializar el servicio de números de factura
        const { InvoiceNumberService } = await import(
          "./shared/services/InvoiceNumberService"
        );
        await InvoiceNumberService.initialize();
       

        console.log("✅ Aplicación inicializada correctamente");
        isInitialized.current = true;
        dispatch(loadAndValidateUser());
      } catch (error) {
        dispatch(loadUserFromStorage());
      }
    };
    init();
  }, [dispatch]);

  useEffect(() => {
    const startReplications = async () => {
      const db = await initDatabase();
      startAllReplications(db);
    };
    startReplications();
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const wasAuthenticated = useRef(isAuthenticated);
  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated && !isValidating) {
      toast.warning("Sesión cerrada", {
        duration: 5000,
      });
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, isValidating]);

  return (
    <div>
      {isValidating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-center py-1 text-sm">
          Validando sesión...
        </div>
      )}
      <AppRoutes />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </div>
  );
}

export default App;
