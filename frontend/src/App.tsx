import { useEffect } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { useAppDispatch } from './shared/store/hooks';
import { loadUserFromStorage } from './shared/store/authSlice';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Cargar usuario del localStorage al iniciar la app
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;
