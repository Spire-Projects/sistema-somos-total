import { Routes, Route, Navigate } from 'react-router';
import { MainLayout } from '../shared/components/MainLayout';
import { LoginPage } from '../features/login/components/LoginPage';
import { DashboardPage } from '../features/dashboard/components/DashboardPage';
import { UserManager } from '../features/users/components/UserManager';
import { InventoryPage } from '../features/inventory/components/InventoryPage';
import { SalesPage } from '../features/sales/components/SalesPage';
import { PurchasesPage } from '../features/purchases/components/PurchasesPage';
import { ClientsPage } from '../features/clients/components/ClientsPage';
import { ReportsPage } from '../features/reports/components/ReportsPage';
import { SettingsPage } from '../features/settings/components/SettingsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { useAppSelector } from '../shared/store/hooks';
import { DailyCashClosuresPage } from '@/features/dailyCashClosure/DayliCashClosurePage';

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
        
        {/* Rutas accesibles para admin y cashier */}
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={["admin", "cashier"]}><DashboardPage /></ProtectedRoute>} />
        <Route path="sales" element={<ProtectedRoute allowedRoles={["admin", "cashier"]}><SalesPage /></ProtectedRoute>} />
        <Route path="clients" element={<ProtectedRoute allowedRoles={["admin", "cashier"]}><ClientsPage /></ProtectedRoute>} />
        
        {/* Rutas accesibles solo para admin */}
        <Route path="inventory" element={<ProtectedRoute allowedRoles={["admin"]}><InventoryPage /></ProtectedRoute>} />
        <Route path="purchases" element={<ProtectedRoute allowedRoles={["admin"]}><PurchasesPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute allowedRoles={["admin"]}><ReportsPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={["admin"]}><UserManager /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute allowedRoles={["admin"]}><SettingsPage /></ProtectedRoute>} />
        <Route path="dailyCash" element={<ProtectedRoute allowedRoles={["admin"]}><DailyCashClosuresPage /></ProtectedRoute>} />
      </Route>
      
      {/* Ruta fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
