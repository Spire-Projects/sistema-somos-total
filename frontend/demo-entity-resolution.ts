/**
 * Ejemplo de uso de la resolución de nombres de entidades relacionadas
 * 
 * Este ejemplo muestra cómo ahora los nombres de categoría, fabricante y forma farmacéutica
 * se resuelven automáticamente cuando se usa searchMedicationCatalogPaginated
 */

import { searchMedicationCatalogPaginated, clearEntityNameCache } from './src/shared/services/MedicationService';

async function demonstrateEntityNameResolution() {
  console.log('🔍 Demostración de resolución de nombres de entidades...\n');

  try {
    // Buscar medicamentos
    const results = await searchMedicationCatalogPaginated('dolor', 1, 3);
    
    console.log(`📋 Encontrados ${results.items.length} medicamentos:`);
    console.log('─'.repeat(80));
    
    results.items.forEach((medication, index) => {
      console.log(`${index + 1}. ${medication.tradeName}`);
      console.log(`   Nombre Comercial: ${medication.comercialName}`);
      console.log(`   Nombre Genérico: ${medication.genericName}`);
      console.log(`   📦 Fabricante: ${medication.manufacturerName}`);
      console.log(`   🏷️  Categoría: ${medication.categoryName}`);
      console.log(`   💊 Forma Farmacéutica: ${medication.pharmaceuticalFormName}`);
      console.log(`   📊 Stock: ${medication.totalActiveStock} unidades`);
      console.log(`   🔄 Lotes activos: ${medication.activeBatchCount}`);
      console.log('');
    });

    // Demostrar cache
    console.log('🚀 Probando cache de entidades...');
    console.log('Segunda búsqueda (debería ser más rápida por el cache):');
    
    const startTime = Date.now();
    const cachedResults = await searchMedicationCatalogPaginated('dolor', 1, 3);
    const endTime = Date.now();
    
    console.log(`⏱️  Tiempo de segunda búsqueda: ${endTime - startTime}ms`);
    console.log(`📊 Resultados en cache: ${cachedResults.items.length} medicamentos`);
    
    // Limpiar cache si es necesario
    clearEntityNameCache();
    console.log('🧹 Cache limpiado');

  } catch (error) {
    console.error('❌ Error en la demostración:', error);
  }
}

// Ejecutar demostración si se ejecuta directamente
if (require.main === module) {
  demonstrateEntityNameResolution();
}

export { demonstrateEntityNameResolution };
