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

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UserManager />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
