/**
 * Script para probar manualmente la replicación bidireccional
 * Ejecutar en la consola del navegador paso a paso
 */

// Paso 1: Verificar estado inicial
console.log("=== PASO 1: Verificando estado inicial ===");
syncTestHelper.testReplicationStates();

// Paso 2: Crear un cliente de prueba
console.log("=== PASO 2: Creando cliente de prueba ===");
const testClient = {
  name: "Cliente Test " + new Date().getTime(),
  email: "test" + new Date().getTime() + "@example.com", 
  phone: "123456789",
  address: "Dirección de prueba"
};

// Ejecutar en Máquina A
const createTestClient = async () => {
  const clientService = await import('./src/shared/services/ClientService');
  const result = await clientService.default.create(testClient);
  console.log("✅ Cliente creado:", result);
  
  // Esperar 5 segundos y verificar sincronización
  setTimeout(() => {
    syncTestHelper.testReplicationFlow('clients', result.id);
  }, 5000);
  
  return result.id;
};

// Paso 3: Actualizar el cliente 
console.log("=== PASO 3: Actualizando cliente ===");
const updateTestClient = async (clientId) => {
  const clientService = await import('./src/shared/services/ClientService');
  const updateData = {
    name: "Cliente ACTUALIZADO " + new Date().getTime(),
    phone: "987654321"
  };
  
  const result = await clientService.default.update(clientId, updateData);
  console.log("✅ Cliente actualizado:", result);
  
  // Verificar estado después de actualización
  setTimeout(() => {
    syncTestHelper.testReplicationFlow('clients', clientId);
  }, 5000);
  
  return result;
};

// Paso 4: Simular llegada de datos remotos
console.log("=== PASO 4: Simulando datos remotos ===");
const simulateRemoteData = async (clientId) => {
  const updateData = {
    name: "ACTUALIZADO DESDE REMOTO " + new Date().getTime(),
    address: "Nueva dirección remota"
  };
  
  const result = await syncTestHelper.simulateRemoteUpdate('clients', clientId, updateData);
  console.log("✅ Datos remotos simulados:", result);
  
  // Verificar que se aplicaron
  setTimeout(() => {
    syncTestHelper.testReplicationFlow('clients', clientId);
  }, 2000);
  
  return result;
};

// Instrucciones para ejecutar paso a paso
console.log(`
🧪 INSTRUCCIONES PARA PROBAR LA REPLICACIÓN:

1. En MÁQUINA A, ejecutar:
   const clientId = await createTestClient();
   
2. En MÁQUINA B, esperar 10 segundos y verificar:
   syncTestHelper.testReplicationFlow('clients');
   
3. En MÁQUINA A, ejecutar:
   await updateTestClient(clientId);
   
4. En MÁQUINA B, esperar 10 segundos y verificar:
   syncTestHelper.testReplicationFlow('clients', clientId);
   
5. En MÁQUINA B, simular datos remotos:
   await simulateRemoteData(clientId);
   
6. En MÁQUINA A, verificar que llegaron los cambios:
   syncTestHelper.testReplicationFlow('clients', clientId);

Nota: Reemplaza 'clientId' con el ID real del cliente creado.
`);

// Hacer disponibles las funciones globalmente para facilitar las pruebas
window.createTestClient = createTestClient;
window.updateTestClient = updateTestClient;
window.simulateRemoteData = simulateRemoteData;
