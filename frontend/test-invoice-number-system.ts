/**
 * Script de prueba completo para el nuevo sistema de numeración de facturas
 * Ejecutar con: npx ts-node test-invoice-number-system.ts
 */

import { InvoiceNumberService } from './src/shared/services/InvoiceNumberService';
import { initDatabase, closeDatabase } from './src/shared/db/database';
import { getNumberInvoiceRangeRepository } from './src/shared/db/repositories/numberInvoiceRange.repository';

// Configurar entorno de prueba
const originalOnline = navigator.onLine;

// Mock del navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Simulador de terminales para testing
class TerminalSimulator {
  private terminalId: string;

  constructor(terminalId: string) {
    this.terminalId = terminalId;
  }

  activate() {
    // Simular ser una terminal específica
    localStorage.setItem('terminal_id', this.terminalId);
    console.log(`🖥️ Activando terminal: ${this.terminalId}`);
  }

  async generateNumbers(count: number): Promise<string[]> {
    const numbers: string[] = [];
    for (let i = 0; i < count; i++) {
      const number = await InvoiceNumberService.getNextInvoiceNumber();
      numbers.push(number);
      console.log(`  ${this.terminalId}: ${number}`);
    }
    return numbers;
  }

  deactivate() {
    localStorage.removeItem('terminal_id');
  }
}

// Funciones de utilidad para testing
async function setOnlineStatus(isOnline: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: isOnline
  });
  console.log(`📡 Estado de conexión: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
}

async function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clearDatabase() {
  console.log('🧹 Limpiando base de datos de prueba...');
  const repository = getNumberInvoiceRangeRepository();
  const allRanges = await repository.findAll();
  for (const range of allRanges) {
    await repository.delete(range.id);
  }
}

async function printStats() {
  console.log('\n📊 ESTADÍSTICAS ACTUALES:');
  console.log('=' .repeat(40));
  const stats = await InvoiceNumberService.getStats();
  console.log(`Total rangos: ${stats.totalRanges}`);
  console.log(`Rangos activos: ${stats.activeRanges}`);
  console.log(`Rangos expirados: ${stats.expiredRanges}`);
  console.log(`Rangos completados: ${stats.completedRanges}`);
  console.log(`Números reciclables: ${stats.recyclableNumbers}`);
  console.log('Rangos por terminal:', stats.terminalRanges);
  console.log('=' .repeat(40));
}

// ===== TESTS INDIVIDUALES =====

async function test1_BasicSequentialNumbers() {
  console.log('\n🧪 TEST 1: Generación secuencial básica');
  console.log('-' .repeat(50));

  const terminal = new TerminalSimulator('TEST-001');
  terminal.activate();

  const numbers = await terminal.generateNumbers(15);
  
  // Verificar que los primeros 10 son secuenciales oficiales
  const officialNumbers = numbers.filter(n => !n.startsWith('TEMP-'));
  const expectedNumbers = Array.from({length: officialNumbers.length}, (_, i) => 
    (i + 1).toString().padStart(7, '0')
  );

  const isSequential = JSON.stringify(officialNumbers.sort()) === JSON.stringify(expectedNumbers);
  
  console.log(`✅ Números oficiales generados: ${officialNumbers.length}`);
  console.log(`✅ Secuencia correcta: ${isSequential ? '✓' : '✗'}`);
  
  terminal.deactivate();
  return isSequential;
}

async function test2_PartialRangeUsage() {
  console.log('\n🧪 TEST 2: Uso parcial de rangos');
  console.log('-' .repeat(50));

  const terminal = new TerminalSimulator('TEST-002');
  terminal.activate();

  // Generar solo 5 números (la mitad del rango)
  const numbers1 = await terminal.generateNumbers(5);
  console.log('Primera sesión - números generados:', numbers1.length);

  // Simular desconexión y reconexión
  terminal.deactivate();
  await waitFor(100);
  terminal.activate();

  // Continuar desde donde se quedó
  const numbers2 = await terminal.generateNumbers(5);
  console.log('Segunda sesión - números generados:', numbers2.length);

  const allNumbers = [...numbers1, ...numbers2];
  const officialNumbers = allNumbers.filter(n => !n.startsWith('TEMP-'));
  const hasDuplicates = new Set(officialNumbers).size !== officialNumbers.length;

  console.log(`✅ Total números: ${allNumbers.length}`);
  console.log(`✅ Números oficiales: ${officialNumbers.length}`);
  console.log(`✅ Sin duplicados: ${!hasDuplicates ? '✓' : '✗'}`);
  
  terminal.deactivate();
  return !hasDuplicates && officialNumbers.length === 10;
}

async function test3_OfflineTemporaryNumbers() {
  console.log('\n🧪 TEST 3: Números temporales offline');
  console.log('-' .repeat(50));

  const terminal = new TerminalSimulator('TEST-003');
  terminal.activate();

  // Generar 10 números online (agotar rango)
  await terminal.generateNumbers(10);
  
  // Ir offline
  await setOnlineStatus(false);
  
  // Generar más números offline (deberían ser temporales)
  const offlineNumbers = await terminal.generateNumbers(5);
  
  const temporalCount = offlineNumbers.filter(n => n.startsWith('TEMP-')).length;
  
  console.log(`✅ Números temporales generados: ${temporalCount}`);
  console.log(`✅ Todos temporales offline: ${temporalCount === 5 ? '✓' : '✗'}`);
  
  // Restaurar conexión
  await setOnlineStatus(true);
  terminal.deactivate();
  
  return temporalCount === 5;
}

async function test4_MultiTerminalConflicts() {
  console.log('\n🧪 TEST 4: Múltiples terminales sin conflictos');
  console.log('-' .repeat(50));

  const terminalA = new TerminalSimulator('TERMINAL-A');
  const terminalB = new TerminalSimulator('TERMINAL-B');

  // Terminal A genera números
  terminalA.activate();
  const numbersA = await terminalA.generateNumbers(8);
  terminalA.deactivate();

  // Terminal B genera números
  terminalB.activate();
  const numbersB = await terminalB.generateNumbers(8);
  terminalB.deactivate();

  // Verificar que no hay duplicados entre terminales
  const allNumbers = [...numbersA, ...numbersB];
  const officialNumbers = allNumbers.filter(n => !n.startsWith('TEMP-'));
  const uniqueNumbers = new Set(officialNumbers);
  const hasDuplicates = uniqueNumbers.size !== officialNumbers.length;

  console.log(`✅ Números Terminal A: ${numbersA.length}`);
  console.log(`✅ Números Terminal B: ${numbersB.length}`);
  console.log(`✅ Total oficiales: ${officialNumbers.length}`);
  console.log(`✅ Sin duplicados entre terminales: ${!hasDuplicates ? '✓' : '✗'}`);

  return !hasDuplicates;
}

async function test5_NumberRecycling() {
  console.log('\n🧪 TEST 5: Reciclaje de números incompletos');
  console.log('-' .repeat(50));

  const terminal = new TerminalSimulator('TEST-005');
  terminal.activate();

  // Generar algunos números para crear un rango usado parcialmente
  await terminal.generateNumbers(5);

  // Simular expiración forzada (manipulando el tiempo)
  const repository = getNumberInvoiceRangeRepository();
  const activeRanges = await repository.findActiveRangesByTerminal('TEST-005');
  
  if (activeRanges.length > 0) {
    // Forzar expiración del rango (establecer expiredAt en el pasado)
    await repository.updateRange(activeRanges[0].id, {
      expiredAt: Date.now() - 1000, // 1 segundo en el pasado
      active: false,
      status: 'expired' as any
    });
  }

  // Obtener números reciclables
  const recyclableNumbers = await repository.findRecyclableNumbers();
  
  console.log(`✅ Rangos reciclables encontrados: ${recyclableNumbers.length}`);
  
  if (recyclableNumbers.length > 0) {
    console.log(`✅ Números reciclables: ${recyclableNumbers[0].startNumber}-${recyclableNumbers[0].endNumber}`);
  }

  // Generar nuevos números (deberían reciclar)
  const newNumbers = await terminal.generateNumbers(3);
  const officialNewNumbers = newNumbers.filter(n => !n.startsWith('TEMP-'));
  
  console.log(`✅ Nuevos números generados: ${officialNewNumbers.length}`);
  
  terminal.deactivate();
  
  return recyclableNumbers.length > 0;
}

async function test6_StressTest() {
  console.log('\n🧪 TEST 6: Prueba de estrés - múltiples terminales simultáneas');
  console.log('-' .repeat(50));

  const terminals = [
    new TerminalSimulator('STRESS-A'),
    new TerminalSimulator('STRESS-B'),
    new TerminalSimulator('STRESS-C')
  ];

  // Generar números en paralelo
  const promises = terminals.map(async (terminal, index) => {
    terminal.activate();
    const numbers = await terminal.generateNumbers(12);
    terminal.deactivate();
    return { terminal: `STRESS-${String.fromCharCode(65 + index)}`, numbers };
  });

  const results = await Promise.all(promises);
  
  // Analizar resultados
  const allNumbers = results.flatMap(r => r.numbers);
  const officialNumbers = allNumbers.filter(n => !n.startsWith('TEMP-'));
  const uniqueNumbers = new Set(officialNumbers);
  const hasDuplicates = uniqueNumbers.size !== officialNumbers.length;

  console.log(`✅ Total números generados: ${allNumbers.length}`);
  console.log(`✅ Números oficiales: ${officialNumbers.length}`);
  console.log(`✅ Sin duplicados: ${!hasDuplicates ? '✓' : '✗'}`);

  results.forEach(result => {
    const officialCount = result.numbers.filter(n => !n.startsWith('TEMP-')).length;
    console.log(`  ${result.terminal}: ${result.numbers.length} total, ${officialCount} oficiales`);
  });

  return !hasDuplicates;
}

// ===== EJECUTOR PRINCIPAL =====

async function runAllTests() {
  console.log('🚀 INICIANDO PRUEBAS DEL SISTEMA DE NUMERACIÓN DE FACTURAS');
  console.log('=' .repeat(70));

  try {
    // Inicializar base de datos
    await initDatabase();
    await InvoiceNumberService.initialize();
    await clearDatabase();

    const testResults: { name: string; passed: boolean }[] = [];

    // Ejecutar tests
    testResults.push({ name: 'Generación secuencial básica', passed: await test1_BasicSequentialNumbers() });
    await clearDatabase();

    testResults.push({ name: 'Uso parcial de rangos', passed: await test2_PartialRangeUsage() });
    await clearDatabase();

    testResults.push({ name: 'Números temporales offline', passed: await test3_OfflineTemporaryNumbers() });
    await clearDatabase();

    testResults.push({ name: 'Múltiples terminales sin conflictos', passed: await test4_MultiTerminalConflicts() });
    await clearDatabase();

    testResults.push({ name: 'Reciclaje de números incompletos', passed: await test5_NumberRecycling() });
    await clearDatabase();

    testResults.push({ name: 'Prueba de estrés simultánea', passed: await test6_StressTest() });

    // Mostrar resultados finales
    console.log('\n' + '=' .repeat(70));
    console.log('📋 RESULTADOS FINALES:');
    console.log('=' .repeat(70));

    let passedTests = 0;
    testResults.forEach(test => {
      const status = test.passed ? '✅ PASÓ' : '❌ FALLÓ';
      console.log(`${status} - ${test.name}`);
      if (test.passed) passedTests++;
    });

    console.log(`\n🎯 RESUMEN: ${passedTests}/${testResults.length} pruebas exitosas`);
    
    if (passedTests === testResults.length) {
      console.log('🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema está funcionando correctamente.');
    } else {
      console.log('⚠️  Algunas pruebas fallaron. Revisar la implementación.');
    }

    await printStats();

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    // Limpieza
    await InvoiceNumberService.destroy();
    await closeDatabase();
    
    // Restaurar estado original
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnline
    });
    
    localStorage.clear();
    
    console.log('\n✅ Pruebas finalizadas y limpieza completada');
  }
}

// Verificar si se está ejecutando como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };