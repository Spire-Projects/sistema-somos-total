// Script simple para probar replicación desde consola del navegador
// Ejecutar en las Dev Tools del navegador

console.log('🧪 Iniciando prueba de replicación...');

// Función para crear un cliente de prueba
async function createTestClient() {
  // Esta función debe ejecutarse en la consola del navegador donde window.db está disponible
  if (typeof window === 'undefined' || !window.db) {
    console.error('❌ Este script debe ejecutarse en la consola del navegador con la app cargada');
    return;
  }

  const testClient = {
    id: `test-client-${Date.now()}`,
    name: `Cliente Prueba ${new Date().toLocaleTimeString()}`,
    email: `test${Date.now()}@example.com`,
    phone: '123456789',
    address: 'Dirección de prueba',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sincronized: false
  };

  try {
    console.log('📝 Creando cliente:', testClient);
    const result = await window.db.clients.insert(testClient);
    console.log('✅ Cliente creado:', result);
    
    // Esperar un poco y luego actualizar
    setTimeout(async () => {
      try {
        console.log('🔄 Actualizando cliente...');
        await result.patch({
          name: `Cliente Actualizado ${new Date().toLocaleTimeString()}`,
          updatedAt: new Date().toISOString(),
          _forceLocalPriority: true
        });
        console.log('✅ Cliente actualizado');
      } catch (error) {
        console.error('❌ Error actualizando:', error);
      }
    }, 2000);
    
    return result;
  } catch (error) {
    console.error('❌ Error creando cliente:', error);
  }
}

// Función para verificar el estado de sincronización
async function checkSyncStatus() {
  if (typeof window === 'undefined' || !window.db) {
    console.error('❌ Este script debe ejecutarse en la consola del navegador');
    return;
  }

  try {
    const clients = await window.db.clients.find().exec();
    console.log('📊 Estado de clientes:');
    clients.forEach(client => {
      console.log(`- ${client.name} (${client.id}): sincronizado=${client.sincronized}, updatedAt=${client.updatedAt}`);
    });
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  }
}

// Función para forzar sincronización
async function forceSyncClients() {
  if (typeof window === 'undefined' || !window.syncTestHelper) {
    console.error('❌ syncTestHelper no está disponible');
    return;
  }

  try {
    console.log('🔄 Forzando sincronización de clientes...');
    await window.syncTestHelper.forceDocumentSync('clients');
    console.log('✅ Sincronización forzada completada');
  } catch (error) {
    console.error('❌ Error en sincronización forzada:', error);
  }
}

console.log(`
🧪 Funciones de prueba disponibles:
- createTestClient(): Crea un cliente de prueba y lo actualiza después de 2 segundos
- checkSyncStatus(): Muestra el estado de sincronización de todos los clientes
- forceSyncClients(): Fuerza la sincronización de clientes

📝 Instrucciones:
1. Abre las Dev Tools (F12)
2. Ve a la pestaña Console
3. Ejecuta: createTestClient()
4. Observa los logs de replicación
5. En otra máquina/navegador, ejecuta: checkSyncStatus()
`);

// Exponer funciones globalmente para facilitar las pruebas
if (typeof window !== 'undefined') {
  window.testReplication = {
    createTestClient,
    checkSyncStatus,
    forceSyncClients
  };
}
