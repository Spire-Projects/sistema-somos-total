import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/SyncService';

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  error: string | null;
  lastSyncType: 'manual' | 'automatic';
  formattedLastSync: string;
}

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSyncTime: null,
    isSyncing: false,
    error: null,
    lastSyncType: 'automatic',
    formattedLastSync: 'Nunca'
  });

  // Actualizar estado de conexión
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkSyncStatus = useCallback(async () => {
    try {
      const [ lastSyncTime, lastSyncType, errorMessage] = await Promise.all([
        
        Promise.resolve(syncService.getLastSyncTime()),
        Promise.resolve(syncService.getLastSyncType()),
        Promise.resolve(syncService.getLastErrorMessage())
      ]);

      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime,
        lastSyncType,
        formattedLastSync: syncService.formatLastSyncTime(),
        error: errorMessage
      }));

    } catch (error) {
      console.error('Error checking sync status:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: 'Error al verificar estado de sincronización'
      }));
    }
  }, []);

  // Inicializar servicio de sincronización
  useEffect(() => {
    const initializeSync = async () => {
      await syncService.initialize();
      checkSyncStatus();
    };

    initializeSync();

    // Monitorear estado cada 30 segundos
    const interval = setInterval(checkSyncStatus, 30000);
    
    // Escuchar cambios en localStorage (cuando SyncService actualiza timestamps)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastSyncTime' || e.key === 'lastSyncType' || e.key === 'lastSyncError') {
        checkSyncStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkSyncStatus]);

  const forceSyncronization = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      await syncService.forceSynchronization();
      await checkSyncStatus();
      
    } catch (error) {
      console.error('Error during forced sync:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: 'Error durante la sincronización'
      }));
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [checkSyncStatus]);

  const formatLastSyncTime = useCallback(() => {
    return syncService.formatLastSyncTime();
  }, [syncStatus.lastSyncTime]);

  return {
    ...syncStatus,
    formatLastSyncTime,
    forceSyncronization,
    refreshStatus: checkSyncStatus
  };
};
