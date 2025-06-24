import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "../shared/store/hooks";
import type { UserRole } from "../shared/types/User";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

/**
 * Un componente que restringe el acceso a rutas basado en roles de usuario.
 * 
 * @param allowedRoles - Los roles que tienen permiso para acceder a esta ruta
 * @param children - Componente hijo a renderizar si el usuario tiene permiso
 * @returns El componente hijo si el usuario tiene permiso, o redirecciona al dashboard
 */
export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Si el usuario no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles permitidos y el usuario no tiene uno de ellos, redirigir al dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si todo está bien, renderizar los children o el Outlet
  return <>{children || <Outlet />}</>;
};
