import { useAppSelector } from "../../../shared/store/hooks";
import { Link } from "react-router";
import { useSyncStatus } from "@/shared/hooks/useSyncStatus";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { 
    isOnline, 
    lastSyncTime, 
    isSyncing, 
    pendingChanges, 
    error, 
    lastSyncType,
    formattedLastSync,
    forceSyncronization 
  } = useSyncStatus();

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
              <Link to={"/inventory"} className="block w-full text-left px-3 py-2 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors">
                Ver Inventario
              </Link>
              <button className="w-full text-left px-3 py-2 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors">
                Nueva Venta
              </button>
              <Link 
                to="/users" 
                className="block w-full text-left px-3 py-2 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
              >
                Gestión de Usuarios
              </Link>
              <Link to={"/reports"} className="block w-full text-left px-3 py-2 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors">
                Reportes
              </Link>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Estado del Sistema</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  Conexión:
                </span>
                <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Última sincronización:</span>
                <div className="text-right">
                  <div className={lastSyncTime ? 'text-gray-700' : 'text-orange-600'}>
                    {formattedLastSync}
                  </div>
                  {lastSyncTime && (
                    <div className="text-xs text-gray-500">
                      {lastSyncType === 'manual' ? '🔄 Manual' : '⚡ Automática'}
                    </div>
                  )}
                </div>
              </div>

          

              {error && (
                <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={forceSyncronization}
                disabled={isSyncing || !isOnline}
                className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
