import { useAppSelector } from "../../../shared/store/hooks";
import { Link } from "react-router";

export const DashboardPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Bienvenido, {user?.fullName}
        </h1>
       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Tu Información</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Rol:</span> <span className="capitalize">{user?.role}</span></p>
              <p><span className="font-medium">Estado:</span> {user?.active ? 'Activo' : 'Inactivo'}</p>
              <p><span className="font-medium">Registro:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors">
                Ver Inventario
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors">
                Nueva Venta
              </button>
              <Link 
                to="/users" 
                className="block w-full text-left px-3 py-2 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
              >
                Gestión de Usuarios
              </Link>
              <button className="w-full text-left px-3 py-2 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors">
                Reportes
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Estado del Sistema</h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span>Conexión:</span>
                <span className="text-green-600 font-medium">Conectado</span>
              </p>
              <p className="flex justify-between">
                <span>Última sincronización:</span>
                <span>Hace 5 min</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
