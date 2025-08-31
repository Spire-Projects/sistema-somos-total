import { useState, useCallback } from 'react';
import { forceSyncService } from '../services/ForceSyncService';

/**
 * Hook para manejar sincronización forzada desde componentes
 */
export const useForceSynchronization = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, any>>({});

  const forceFullSync = useCallback(async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      console.log('🚀 Iniciando sincronización forzada desde UI');
      
      await forceSyncService.forceFullSync();
      
      setLastSyncTime(new Date());
      console.log('✅ Sincronización forzada completada');
    } catch (error) {
      console.error('❌ Error en sincronización forzada:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const forceCollectionSync = useCallback(async (collectionName: string) => {
    try {
      console.log(`🔄 Forzando sincronización de ${collectionName}`);
      await forceSyncService.forceCollectionSync(collectionName);
      console.log(`✅ Sincronización de ${collectionName} completada`);
    } catch (error) {
      console.error(`❌ Error al sincronizar ${collectionName}:`, error);
      throw error;
    }
  }, []);

  const checkSyncStatus = useCallback(async () => {
    try {
      const status = await forceSyncService.checkSyncStatus();
      setSyncStatus(status);
      return status;
    } catch (error) {
      console.error('❌ Error al verificar estado de sincronización:', error);
      return {};
    }
  }, []);

  const resolvePendingSync = useCallback(async () => {
    try {
      console.log('🔍 Resolviendo documentos pendientes de sincronización');
      await forceSyncService.resolvePendingSync();
      console.log('✅ Documentos pendientes resueltos');
    } catch (error) {
      console.error('❌ Error al resolver documentos pendientes:', error);
      throw error;
    }
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    syncStatus,
    forceFullSync,
    forceCollectionSync,
    checkSyncStatus,
    resolvePendingSync
  };
};

/**
 * Componente para mostrar estado de sincronización y botones de control
 */
export const SyncStatusComponent = () => {
  const { 
    isSyncing, 
    lastSyncTime, 
    syncStatus, 
    forceFullSync, 
    checkSyncStatus,
    resolvePendingSync 
  } = useForceSynchronization();

  const handleForceSync = async () => {
    try {
      await forceFullSync();
      alert('Sincronización completada exitosamente');
    } catch (error) {
      alert('Error en la sincronización. Ver consola para más detalles.');
    }
  };

  const handleCheckStatus = async () => {
    await checkSyncStatus();
  };

  const handleResolvePending = async () => {
    try {
      await resolvePendingSync();
      alert('Documentos pendientes resueltos');
    } catch (error) {
      alert('Error al resolver documentos pendientes');
    }
  };

  return (
    <div className="sync-status-panel" style={{ 
      padding: '1rem', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <h3>🔄 Estado de Sincronización</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Estado:</strong> {isSyncing ? '🟡 Sincronizando...' : '🟢 Listo'}</p>
        {lastSyncTime && (
          <p><strong>Última sincronización:</strong> {lastSyncTime.toLocaleString()}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={handleForceSync}
          disabled={isSyncing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isSyncing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSyncing ? 'not-allowed' : 'pointer'
          }}
        >
          {isSyncing ? 'Sincronizando...' : 'Forzar Sincronización'}
        </button>

        <button 
          onClick={handleCheckStatus}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Verificar Estado
        </button>

        <button 
          onClick={handleResolvePending}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Resolver Pendientes
        </button>
      </div>

      {Object.keys(syncStatus).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Estado por Colección:</h4>
          <div style={{ fontSize: '0.875rem' }}>
            {Object.entries(syncStatus).map(([collection, status]) => (
              <div key={collection} style={{ marginBottom: '0.25rem' }}>
                <strong>{collection}:</strong> {
                  (status as any)?.isActive ? '🟢 Activo' : '🔴 Inactivo'
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
