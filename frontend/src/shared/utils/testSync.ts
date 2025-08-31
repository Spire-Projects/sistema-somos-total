import { initDatabase } from '../db/database';
import { getClientRepository } from '../db/repositories/client.repository';

/**
 * Funciones de testing para verificar que la sincronización funciona
 */
export const testSyncFunctions = {
  /**
   * Test básico de creación y actualización de cliente
   */
  async testClientSync() {
    console.log('🧪 Iniciando test de sincronización de clientes...');
    
    try {
      const clientRepo = getClientRepository();
      
      // 1. Crear un cliente de prueba
      console.log('📝 Creando cliente de prueba...');
      const testClient = await clientRepo.create({
        name: `Cliente Test ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        nit: `${Date.now()}`,
        phone: '123456789',
        address: 'Dirección de prueba',
        loyaltyPoints: 0,
        salesHistory: [],
        isDeleted: false,
        sincronized: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Cliente creado:', testClient);
      
      // 2. Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Actualizar el cliente
      console.log('🔄 Actualizando cliente...');
      const updatedClient = await clientRepo.update(testClient.id, {
        name: `Cliente Actualizado ${Date.now()}`,
        loyaltyPoints: 100
      });
      
      console.log('✅ Cliente actualizado:', updatedClient);
      
      // 4. Verificar en base de datos
      console.log('🔍 Verificando en base de datos...');
      const foundClient = await clientRepo.findById(testClient.id);
      console.log('📋 Cliente encontrado:', foundClient);
      
      return {
        success: true,
        originalClient: testClient,
        updatedClient,
        foundClient
      };
      
    } catch (error) {
      console.error('❌ Error en test de sincronización:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  /**
   * Test directo de RxDB para verificar que funciona sin BaseRepository
   */
  async testDirectRxDB() {
    console.log('🧪 Test directo de RxDB...');
    
    try {
      const db = await initDatabase();
      
      // Crear documento directamente
      const testDoc = {
        id: `test-direct-${Date.now()}`,
        name: 'Test Direct RxDB',
        email: `direct${Date.now()}@example.com`,
        nit: `direct-${Date.now()}`,
        phone: '123456789',
        address: 'Direct test',
        loyaltyPoints: 0,
        salesHistory: [],
        isDeleted: false,
        sincronized: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('📝 Insertando documento directamente...');
      const insertedDoc = await db.clients.insert(testDoc);
      console.log('✅ Documento insertado:', insertedDoc.toJSON());
      
      // Actualizar documento directamente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Actualizando documento directamente...');
      await insertedDoc.patch({
        name: 'Test Direct Updated',
        loyaltyPoints: 50,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Documento actualizado:', insertedDoc.toJSON());
      
      return {
        success: true,
        document: insertedDoc.toJSON()
      };
      
    } catch (error) {
      console.error('❌ Error en test directo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  /**
   * Verificar estado de replicación
   */
  async checkReplicationStatus() {
    console.log('🔍 Verificando estado de replicación...');
    
    try {
      const db = await initDatabase();
      
      // Verificar si las colecciones tienen replicación activa
      const collections = ['clients', 'medications', 'sales', 'users'];
      const status: Record<string, any> = {};
      
      for (const collectionName of collections) {
        const collection = (db as any)[collectionName];
        
        if (collection) {
          // Verificar si tiene replicationState
          const hasReplication = !!(collection.replicationState);
          
          status[collectionName] = {
            exists: true,
            hasReplication,
            documentCount: await collection.count().exec()
          };
          
          if (hasReplication) {
            try {
              // Intentar obtener estado de replicación
              const replicationState = collection.replicationState;
              const isActive = replicationState?.active$ ? 'Observable disponible' : 'No disponible';
              
              status[collectionName].replicationActive = isActive;
            } catch (error) {
              status[collectionName].replicationError = error instanceof Error ? error.message : 'Error desconocido';
            }
          }
        } else {
          status[collectionName] = {
            exists: false
          };
        }
      }
      
      console.log('📊 Estado de replicación:', status);
      return status;
      
    } catch (error) {
      console.error('❌ Error al verificar replicación:', error);
      return {
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
};

// Agregar al window para debugging
declare global {
  interface Window {
    testSync: typeof testSyncFunctions;
  }
}

if (typeof window !== 'undefined') {
  window.testSync = testSyncFunctions;
  console.log(`
🧪 Funciones de Testing Disponibles:
- window.testSync.testClientSync() - Test completo de sincronización de clientes
- window.testSync.testDirectRxDB() - Test directo de RxDB sin BaseRepository  
- window.testSync.checkReplicationStatus() - Verificar estado de replicación

🔧 Otras herramientas de debugging:
- window.syncDebug (si está en modo desarrollo)
- window.forceSync (si está disponible)

🚀 Para iniciar pruebas rápidas:
  window.testSync.checkReplicationStatus().then(console.log)
  `);
}
