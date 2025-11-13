import { Routes, Route, Navigate } from 'react-router';
import { Suspense, lazy } from 'react';
import { MainLayout } from '../shared/components/MainLayout';
import { LoginPage } from '../features/login/components/LoginPage';
import { DashboardPage } from '../features/dashboard/components/DashboardPage';
import { SalesPage } from '../features/sales/views/SalesPage';
import { ClientsPage } from '../features/clients/components/ClientsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { useAppSelector } from '../shared/store/hooks';
import { InventoryPage } from '@/features/inventory/views/InventoryPage';

// Lazy loading solo para páginas menos críticas
const UserManager = lazy(() => import('../features/users/views/UserManager').then(module => ({ default: module.UserManager })));
const PurchasesPage = lazy(() => import('../features/purchases/components/PurchasesPage').then(module => ({ default: module.PurchasesPage })));
const ReportsPage = lazy(() => import('../features/reports/components/ReportsPage').then(module => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import('../features/settings/components/SettingsPage').then(module => ({ default: module.SettingsPage })));
const DailyCashClosuresPage = lazy(() => import('@/features/dailyCashClosure/DayliCashClosurePage').then(module => ({ default: module.DailyCashClosuresPage })));

// Componente de carga más simple
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
  </div>
);

export const AppRoutes = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  return (
    <Routes>
      {/* Ruta pública: login */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      
      {/* Rutas protegidas: requieren autenticación */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Rutas accesibles para admin y cashier - SIN lazy loading para mayor velocidad */}
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={["admin", "cashier"]}><DashboardPage /></ProtectedRoute>} />
        <Route path="sales" element={<ProtectedRoute allowedRoles={["admin", "cashier"]}><SalesPage /></ProtectedRoute>} />
        <Route path="clients" element={<ProtectedRoute allowedRoles={["admin", "cashier"]}><ClientsPage /></ProtectedRoute>} />
        
        {/* Página crítica de inventario - SIN lazy loading */}
        <Route path="inventory" element={<ProtectedRoute allowedRoles={["admin"]}><InventoryPage /></ProtectedRoute>} />
        
        {/* Rutas menos críticas - CON lazy loading */}
        <Route path="purchases" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<PageLoader />}><PurchasesPage /></Suspense></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<PageLoader />}><ReportsPage /></Suspense></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<PageLoader />}><UserManager /></Suspense></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ProtectedRoute>} />
        <Route path="dailyCash" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<PageLoader />}><DailyCashClosuresPage /></Suspense></ProtectedRoute>} />
      </Route>
      
      {/* Ruta fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
