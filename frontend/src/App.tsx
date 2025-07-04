import { useEffect } from "react";
import { Toaster } from "sonner";
import { AppRoutes } from "./routes/AppRoutes";
import { useAppDispatch } from "./shared/store/hooks";
import { loadUserFromStorage } from "./shared/store/authSlice";
// import { initDatabase } from "./shared/db/database";
// import { startAllReplications } from "./shared/db/replication/startReplications";

function App() {
  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   const init = async () => {
  //     const db = await initDatabase();
  //     startAllReplications(db);
  //   };
  //   init();
  // }, []);

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
