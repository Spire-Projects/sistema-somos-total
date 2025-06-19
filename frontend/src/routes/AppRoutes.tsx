import { Routes, Route, Navigate } from 'react-router';
import { MainLayout } from '../shared/components/MainLayout';
import { LoginPage } from '../features/login/components/LoginPage';
import { DashboardPage } from '../features/dashboard/components/DashboardPage';
import { UserManager } from '../features/users/components/UserManager';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UserManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
