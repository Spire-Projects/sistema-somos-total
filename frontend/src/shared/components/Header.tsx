import { useAppSelector } from "../store/hooks";
import { Bell, ChevronDown } from "lucide-react";
import { useLocation } from "react-router";

export const Header = () => {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Función para obtener el nombre de la sección actual basado en la ruta
  const sectionNames: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/inventory': 'Inventario',
    '/sales': 'Ventas',
    '/purchases': 'Compras',
    '/clients': 'Clientes',
    '/reports': 'Reportes',
    '/users': 'Usuarios',
    '/settings': 'Configuración',
  };

  const getSectionName = () => {
    return sectionNames[location.pathname] || 'Dashboard';
  };
  

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex justify-between items-center">
        {/* Right section - Actions and User */}
        {user && (
          <div className="flex items-center justify-between gap-4 ml-6 w-full">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getSectionName()}</h2>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  1
                </span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-sm text-right">
                  <div className="font-medium text-gray-900">
                    {user.fullName}
                  </div>
                  <div className="text-gray-500 capitalize">{user.role}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
