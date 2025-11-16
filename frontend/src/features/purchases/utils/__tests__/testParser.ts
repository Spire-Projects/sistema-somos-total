/**
 * Script de prueba para el parser de Excel
 * 
 * Para usar:
 * 1. Abrir consola del navegador en la página de Compras
 * 2. Copiar y pegar este código
 * 3. Llamar a testParser() con un archivo Excel
 */

import { parseExcelFile } from '../parseExcelPurchases';

export async function testParserWithFile(file: File) {
  console.log('🧪 Iniciando prueba del parser...');
  console.log('📁 Archivo:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
  
  try {
    const startTime = performance.now();
    const result = await parseExcelFile(file);
    const endTime = performance.now();
    
    console.log('✅ Parser completado en', (endTime - startTime).toFixed(2), 'ms');
    console.log('📊 Resultados:');
    console.log('  - Total de filas procesadas:', result.totalRowsProcessed);
    console.log('  - Filas válidas encontradas:', result.validRows.length);
    console.log('  - Errores:', result.errors.length);
    
    if (result.errors.length > 0) {
      console.log('⚠️ Errores encontrados:');
      result.errors.forEach((error: string, idx: number) => {
        console.log(`  ${idx + 1}. ${error}`);
      });
    }
    
    if (result.validRows.length > 0) {
      console.log('📋 Primeras 5 filas válidas:');
      console.table(result.validRows.slice(0, 5).map((row) => ({
        Fila: row.rowNumber,
        Código: row.codigo,
        Descripción: row.descripcion?.substring(0, 30) + '...',
        Pzas: row.pzas,
        'P.U': row.pu,
      })));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en el parser:', error);
    throw error;
  }
}

// Ejemplo de uso con input file
export function setupTestInput() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      await testParserWithFile(file);
    }
  };
  input.click();
}

// Usar desde consola: setupTestInput()
