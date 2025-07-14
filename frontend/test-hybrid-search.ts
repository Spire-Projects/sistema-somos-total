/**
 * Script de prueba para verificar la búsqueda híbrida de medicamentos
 * Ejecutar con: npx ts-node test-hybrid-search.ts
 */

import { searchMedicationCatalogPaginated } from './src/shared/services/MedicationService';

async function testHybridSearch() {
  console.log('🔍 Iniciando pruebas de búsqueda híbrida...\n');

  try {
    // Test 1: Búsqueda por nombre comercial
    console.log('📋 Test 1: Búsqueda por nombre comercial');
    const test1 = await searchMedicationCatalogPaginated('aspirin', 1, 5);
    console.log(`  - Resultados: ${test1.items.length} medicamentos encontrados`);
    console.log(`  - Primeros nombres: ${test1.items.slice(0, 3).map(m => m.tradeName).join(', ')}\n`);

    // Test 2: Búsqueda por nombre genérico
    console.log('📋 Test 2: Búsqueda por nombre genérico');
    const test2 = await searchMedicationCatalogPaginated('acetylsalicylic', 1, 5);
    console.log(`  - Resultados: ${test2.items.length} medicamentos encontrados`);
    console.log(`  - Nombres genéricos: ${test2.items.slice(0, 3).map(m => m.genericName).join(', ')}\n`);

    // Test 3: Búsqueda por código de barras
    console.log('📋 Test 3: Búsqueda por código de barras');
    const test3 = await searchMedicationCatalogPaginated('1234567890', 1, 5);
    console.log(`  - Resultados: ${test3.items.length} medicamentos encontrados\n`);

    // Test 4: Búsqueda vacía (debería devolver medicamentos con stock)
    console.log('📋 Test 4: Búsqueda vacía');
    const test4 = await searchMedicationCatalogPaginated('', 1, 5);
    console.log(`  - Resultados: ${test4.items.length} medicamentos encontrados\n`);

    // Test 5: Búsqueda con filtros
    console.log('📋 Test 5: Búsqueda con filtros (solo con stock)');
    const test5 = await searchMedicationCatalogPaginated('dolor', 1, 5, { hasStock: true });
    console.log(`  - Resultados: ${test5.items.length} medicamentos encontrados`);
    console.log(`  - Stock total: ${test5.items.map(m => m.totalActiveStock).join(', ')}\n`);

    console.log('✅ Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  testHybridSearch();
}

export { testHybridSearch };
