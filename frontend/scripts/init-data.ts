#!/usr/bin/env tsx

/**
 * Script para cargar datos iniciales de medicamentos
 * Ejecutar con: npm run init-data
 */

import { initDatabase } from '../src/shared/db/database';
import { 
  initializeActiveIngredients,
  initializeMedicationCategories,
  initializePharmaceuticalForms,
  initializeManufacturers,
  initializeMedicationData,
  initializeAllData
} from '../src/shared/utils/init-data.utils';

// Función para mostrar ayuda
function showHelp() {
  console.log(`
🏥 FarmaApp - Script de Inicialización de Datos

Uso: npm run init-data [comando]

Comandos disponibles:
  all                    - Inicializar todos los datos (usuarios + medicamentos)
  medications           - Inicializar solo datos de medicamentos
  ingredients           - Inicializar solo ingredientes activos
  categories            - Inicializar solo categorías de medicamentos
  forms                 - Inicializar solo formas farmacéuticas
  manufacturers         - Inicializar solo fabricantes
  help                  - Mostrar esta ayuda

Ejemplos:
  npm run init-data all
  npm run init-data medications
  npm run init-data ingredients
  `);
}

// Función principal
async function main() {
  const command = process.argv[2] || 'help';
  
  if (command === 'help') {
    showHelp();
    return;
  }

  try {
    console.log('🚀 Inicializando base de datos...');
    await initDatabase();
    console.log('✅ Base de datos lista');
    
    switch (command) {
      case 'all':
        await initializeAllData();
        break;
        
      case 'medications':
        await initializeMedicationData();
        break;
        
      case 'ingredients':
        await initializeActiveIngredients();
        break;
        
      case 'categories':
        await initializeMedicationCategories();
        break;
        
      case 'forms':
        await initializePharmaceuticalForms();
        break;
        
      case 'manufacturers':
        await initializeManufacturers();
        break;
        
      default:
        console.error(`❌ Comando desconocido: ${command}`);
        console.log('💡 Usa "npm run init-data help" para ver los comandos disponibles');
        process.exit(1);
    }
    
    console.log('🎉 Proceso completado exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  }
}

// Ejecutar script
main();
