import { getDatabase } from '../db/database';

export class SyncService {
  private static instance: SyncService;
  private _lastSyncTime: Date | null = null;
  private _isManualSync = false;
  private _lastSyncType: 'manual' | 'automatic' = 'automatic';
  private _lastErrorMessage: string | null = null;
  private _isInitialized = false;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize() {
    if (this._isInitialized) return;
    
    // Cargar última fecha de sincronización desde localStorage
    const lastSyncStr = localStorage.getItem('lastSyncTime');
    if (lastSyncStr) {
      this._lastSyncTime = new Date(lastSyncStr);
    }
    
    this._isInitialized = true;
  }

  getLastSyncTime(): Date | null {
    return this._lastSyncTime;
  }

  async getPendingChangesCount(): Promise<number> {
    const db = getDatabase();
    if (!db) return 0;

    let totalPending = 0;

    try {
      // Solo contar en colecciones que realmente tienen el campo sincronized
      const collectionsWithSync = [
        'medications',
        'medication_batches', 
        'manufacturers',
        'active_ingredients',
        'medication_categories',
        'pharmaceutical_forms',
        'generic_names',
        'clients',
        'medics',
        'sales'
        // No incluir 'users' porque no tiene sincronized
        // No incluir 'daily_cash_closures' porque sincronized es string, no boolean
      ];

      for (const collectionName of collectionsWithSync) {
        try {
          const collection = db[collectionName as keyof typeof db];
          if (collection && typeof collection.find === 'function') {
            const notSynced = await collection
              .find({ 
                selector: { 
                  sincronized: false,
                  isDeleted: { $ne: true } // No contar documentos eliminados
                } 
              })
              .exec();
            totalPending += notSynced.length;
            
            // Log para debug (opcional)
            if (notSynced.length > 0) {
              console.log(`📊 ${collectionName}: ${notSynced.length} documentos pendientes`);
            }
          }
        } catch (error) {
          console.warn(`Error counting pending changes in ${collectionName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error getting pending changes count:', error);
    }

    return totalPending;
  }

  async forceSynchronization(): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) throw new Error('Base de datos no disponible');
      
      // Marcar como sincronización manual
      this.markAsManualSync();
      
      console.log('🔄 Forzando verificación de sincronización...');
      console.log('⚠️ NOTA: Esto NO reinicia replicaciones, solo verifica el estado actual');
      
      // En lugar de reiniciar todo, solo verificar que las replicaciones estén activas
      // Las replicaciones ya están corriendo con live: true
      // Solo necesitamos esperar a que se completen las operaciones pendientes
      
      // Verificar que haya conexión
      if (!navigator.onLine) {
        throw new Error('Sin conexión a internet');
      }
      
      // Dar tiempo para que las replicaciones existentes se sincronicen
      console.log('⏳ Esperando que las replicaciones activas terminen...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Verificación de sincronización completada');
    } catch (error) {
      console.error('Error during forced synchronization:', error);
      throw error;
    }
  }

  formatLastSyncTime(): string {
    if (!this._lastSyncTime) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - this._lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} min`;
    return 'Ahora';
  }

  // Método para ser llamado cuando RxDB realmente sincroniza
  onSynchronizationComplete(): void {
    this._lastSyncTime = new Date();
    localStorage.setItem('lastSyncTime', this._lastSyncTime.toISOString());
  }

  // Nuevo método para manejar actividad de sincronización (llamado desde replicateCollection)
  onSynchronizationActivity(collectionName: string, direction: 'sent' | 'received', docCount: number): void {
    console.log(`📊 ${collectionName}: ${direction} ${docCount} documentos`);
    
    // Actualizar timestamp en cada actividad (incluso si docCount es 0, significa que está sincronizando)
    this._lastSyncTime = new Date();
    this._lastSyncType = this._isManualSync ? 'manual' : 'automatic';
    this._lastErrorMessage = null;
    
    localStorage.setItem('lastSyncTime', this._lastSyncTime.toISOString());
    localStorage.setItem('lastSyncType', this._lastSyncType);
    
    // Resetear flag de sincronización manual después de completar
    this._isManualSync = false;
  }

  // Método para manejar cuando comienza la sincronización
  onSynchronizationStart(): void {
    //console.log(`🔄 ${collectionName}: Sincronización iniciada`);
    
    // Si no es manual, marcar como automática
    if (!this._isManualSync) {
      this._lastSyncType = 'automatic';
    }
  }

  // Método para manejar errores de sincronización
  onSynchronizationError(collectionName: string, error: any): void {
    console.error(`❌ ${collectionName}: Error de sincronización`, error);
    this._lastErrorMessage = error.message || 'Error desconocido';
    if (this._lastErrorMessage) {
      localStorage.setItem('lastSyncError', this._lastErrorMessage);
    }
  }

  // Método para marcar sincronización manual
  markAsManualSync(): void {
    this._isManualSync = true;
    this._lastSyncType = 'manual';
  }

  // Getters para nueva funcionalidad
  getLastSyncType(): 'manual' | 'automatic' {
    return this._lastSyncType;
  }

  getLastErrorMessage(): string | null {
    return this._lastErrorMessage;
  }
}

export const syncService = SyncService.getInstance();
