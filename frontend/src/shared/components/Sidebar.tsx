import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  Users, 
  FileText, 
  Settings,
  LogOut
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import { Button } from './ui/button';

interface SidebarProps {
  className?: string;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-green-600'
  },
  {
    title: 'Inventario',
    icon: Package,
    href: '/inventory',
    color: 'text-blue-600'
  },
  {
    title: 'Ventas',
    icon: ShoppingCart,
    href: '/sales',
    color: 'text-purple-600'
  },
  {
    title: 'Compras',
    icon: ShoppingBag,
    href: '/purchases',
    color: 'text-orange-600'
  },
  {
    title: 'Clientes',
    icon: Users,
    href: '/clients',
    color: 'text-pink-600'
  },
  {
    title: 'Reportes',
    icon: FileText,
    href: '/reports',
    color: 'text-indigo-600'
  },
  {
    title: 'Usuarios',
    icon: Users,
    href: '/users',
    color: 'text-cyan-600'
  },
  {
    title: 'Configuración',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-600'
  }
];

export const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className={cn(
      "flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-sm",
      className
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 shadow-sm">
            <span className="text-lg font-bold text-white">F</span>
          </div>
          <span className="text-xl font-bold text-green-700">FarmaPlus</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-green-50 text-green-700 shadow-sm border-l-4 border-green-600 ml-0"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 ml-4"
              )}
            >
              <Icon 
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-green-600" : item.color
                )} 
              />
              <p className='text-gray-600'>
              {item.title}
              </p>
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
  );
};
