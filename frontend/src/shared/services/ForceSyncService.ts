import { initDatabase } from '../db/database';

/**
 * Servicio para forzar sincronización manual cuando hay problemas
 */
export class ForceSyncService {
  private static instance: ForceSyncService;
  private isForcing = false;

  static getInstance(): ForceSyncService {
    if (!ForceSyncService.instance) {
      ForceSyncService.instance = new ForceSyncService();
    }
    return ForceSyncService.instance;
  }

  /**
   * Fuerza la sincronización de todas las colecciones
   */
  async forceFullSync(): Promise<void> {
    if (this.isForcing) {
      console.log('🔄 Ya hay una sincronización forzada en proceso');
      return;
    }

    try {
      this.isForcing = true;
      console.log('🚀 Iniciando sincronización forzada de todas las colecciones');

      const db = await initDatabase();
      const collections = [
        'medications',
        'clients', 
        'sales',
        'users',
        'manufacturers',
        'pharmaceutical_forms',
        'active_ingredients',
        'medication_categories'
      ];

      for (const collectionName of collections) {
        try {
          console.log(`🔄 Forzando sincronización de ${collectionName}`);
          const collection = (db as any)[collectionName];
          
          if (collection && collection.replicationState) {
            // Cancelar y reiniciar replicación
            await collection.replicationState.cancel();
            
            // Esperar un momento
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Reiniciar replicación
            await collection.replicationState.start();
            
            console.log(`✅ Replicación reiniciada para ${collectionName}`);
          }
        } catch (error) {
          console.error(`❌ Error al reiniciar ${collectionName}:`, error);
        }
      }

      console.log('✅ Sincronización forzada completada');
    } catch (error) {
      console.error('❌ Error en sincronización forzada:', error);
    } finally {
      this.isForcing = false;
    }
  }

  /**
   * Fuerza la sincronización de una colección específica
   */
  async forceCollectionSync(collectionName: string): Promise<void> {
    try {
      console.log(`🔄 Forzando sincronización de ${collectionName}`);
      
      const db = await initDatabase();
      const collection = (db as any)[collectionName];
      
      if (collection && collection.replicationState) {
        // Forzar pull desde Firestore
        await collection.replicationState.reSync();
        console.log(`✅ Sincronización forzada completada para ${collectionName}`);
      } else {
        console.warn(`⚠️ No se encontró replicación activa para ${collectionName}`);
      }
    } catch (error) {
      console.error(`❌ Error al forzar sincronización de ${collectionName}:`, error);
    }
  }

  /**
   * Verifica el estado de sincronización de todas las colecciones
   */
  async checkSyncStatus(): Promise<Record<string, any>> {
    try {
      const db = await initDatabase();
      const collections = [
        'medications',
        'clients', 
        'sales',
        'users',
        'manufacturers',
        'pharmaceutical_forms',
        'active_ingredients',
        'medication_categories'
      ];

      const status: Record<string, any> = {};

      for (const collectionName of collections) {
        try {
          const collection = (db as any)[collectionName];
          
          if (collection && collection.replicationState) {
            const replicationState = collection.replicationState;
            
            status[collectionName] = {
              isActive: await replicationState.active$.pipe().toPromise(),
              errors: await replicationState.error$.pipe().toPromise(),
              lastSync: new Date().toISOString()
            };
          } else {
            status[collectionName] = {
              isActive: false,
              errors: 'No replication found',
              lastSync: null
            };
          }
        } catch (error) {
          status[collectionName] = {
            isActive: false,
            errors: error instanceof Error ? error.message : 'Unknown error',
            lastSync: null
          };
        }
      }

      console.log('📊 Estado de sincronización:', status);
      return status;
    } catch (error) {
      console.error('❌ Error al verificar estado de sincronización:', error);
      return {};
    }
  }

  /**
   * Detecta y resuelve documentos no sincronizados
   */
  async resolvePendingSync(): Promise<void> {
    try {
      console.log('🔍 Buscando documentos pendientes de sincronización');
      
      const db = await initDatabase();
      const collections = ['medications', 'clients', 'sales', 'users'];

      for (const collectionName of collections) {
        try {
          const collection = (db as any)[collectionName];
          
          // Buscar documentos con sincronized: false o sin _lastSyncedAt
          const pendingDocs = await collection.find({
            selector: {
              $or: [
                { sincronized: false },
                { _lastSyncedAt: { $exists: false } }
              ]
            }
          }).exec();

          if (pendingDocs.length > 0) {
            console.log(`📋 ${collectionName}: ${pendingDocs.length} documentos pendientes`);
            
            // Forzar actualización para trigger sync
            for (const doc of pendingDocs) {
              await doc.patch({
                _lastModifiedAt: new Date().toISOString(),
                _forceSync: true
              });
            }
            
            console.log(`✅ ${collectionName}: Documentos marcados para re-sincronización`);
          } else {
            console.log(`✅ ${collectionName}: Todos los documentos sincronizados`);
          }
        } catch (error) {
          console.error(`❌ Error en ${collectionName}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error al resolver sincronización pendiente:', error);
    }
  }
}

export const forceSyncService = ForceSyncService.getInstance();
