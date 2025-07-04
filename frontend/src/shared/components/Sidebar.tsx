import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  FileText,
  Settings,
  LogOut,
  X,
  Book,
} from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";
import { Button } from "./ui/button";
import logo from "../../assets/logo.png"
import type { UserRole } from "../types/User";
import { useEffect } from "react";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  title: string;
  icon: any;
  href: string;
  color: string;
  roles?: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-green-600",
    roles: ["admin", "cashier"],
  },
  {
    title: "Inventario",
    icon: Package,
    href: "/inventory",
    color: "text-blue-600",
    roles: ["admin"],
  },
  {
    title: "Ventas",
    icon: ShoppingBag,
    href: "/sales",
    color: "text-purple-600",
    roles: ["admin", "cashier"],
  },
  {
    title: "Compras",
    icon: ShoppingCart,
    href: "/purchases",
    color: "text-orange-600",
    roles: ["admin"],
  },
  {
    title: "Clientes",
    icon: Users,
    href: "/clients",
    color: "text-pink-600",
    roles: ["admin", "cashier"],
  },
  {
    title: "Reportes",
    icon: FileText,
    href: "/reports",
    color: "text-indigo-600",
    roles: ["admin"],
  },
  {
    title: "Usuarios",
    icon: Users,
    href: "/users",
    color: "text-cyan-600",
    roles: ["admin"],
  },
  {
    title: "Arqueo de Caja",
    icon: Book,
    href: "/dailyCash",
    color: "text-orange-600",
    roles: ["admin"],
  },
  {
    title: "Configuración",
    icon: Settings,
    href: "/settings",
    color: "text-gray-600",
    roles: ["admin"],
  },
];

export const Sidebar = ({ className, isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Cerrar sidebar en cambio de ruta SOLO si está abierto en dispositivos móviles
  useEffect(() => {
    if (onClose && isOpen && window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname]); // Removido onClose de las dependencias para evitar loops

  // Filtrar elementos del menú según el rol del usuario
  const visibleMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Overlay para dispositivos móviles - solo cuando isOpen es true */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      <div
        className={cn(
          // En desktop: siempre visible y relativo
          // En mobile/tablet: fijo y con transform basado en isOpen
          "lg:relative lg:translate-x-0 lg:z-0",
          "fixed top-0 left-0 h-full z-50",
          "flex flex-col bg-white border-r border-gray-200 shadow-sm",
          "w-64 transition-transform duration-300 ease-in-out",
          // En mobile/tablet: mostrar/ocultar basado en isOpen
          // En desktop: siempre visible
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Botón cerrar en móvil/tablet */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 lg:hidden z-10"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
        
        {/* Logo */}
        <div className="flex h-20 items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Logo" className="h-16 p-1 w-auto object-contain" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-red-50 text-green-700 shadow-sm border-l-4 border-secondary ml-0"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 ml-4"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-secondary" : item.color
                  )}
                />
                <p className="text-gray-600">{item.title}</p>
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-3">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="group flex w-full items-center justify-start px-3 py-2.5 text-gray-600 font-medium rounded-lg"
          >
            <LogOut className="h-5 w-5 mr-3 text-gray-500 group-hover:text-green-600" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  );
};
