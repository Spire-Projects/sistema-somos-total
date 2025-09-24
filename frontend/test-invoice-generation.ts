/**
 * Script de prueba para verificar la generación secuencial de números de factura
 * Ejecutar con: npx ts-node test-invoice-generation.ts
 */

import { createSale } from './src/shared/services/SalesService';
import { getSaleRepository } from './src/shared/db/repositories/sale.repository';
import type { Sale } from './src/shared/types/Sales';

async function testInvoiceNumberGeneration() {
  console.log('🧾 Iniciando pruebas de generación de números de factura...\n');

  try {
    const repository = getSaleRepository();

    // Test 1: Verificar el número más alto actual
    console.log('📋 Test 1: Obtener número de factura más alto actual');
    const highestNumber = await repository.getHighestInvoiceNumber();
    console.log(`  - Número más alto actual: ${highestNumber.toString().padStart(7, '0')}\n`);

    // Test 2: Crear una venta de prueba para verificar secuencia
    console.log('📋 Test 2: Crear venta de prueba');
    const testSaleData: Omit<Sale, 'id' | 'createdAt'> = {
      items: [
        {
          batchId: 'test-batch-001',
          medicationId: 'test-med-001',
          quantity: 1,
          unitPrice: 10.00,
          total: 10.00
        }
      ],
      total: 10.00,
      paymentMethod: 'efectivo',
      createdBy: 'test-user',
      factured: false
    };

    const createdSale = await createSale(testSaleData);
    console.log(`  - Venta creada con ID: ${createdSale.id}`);
    console.log(`  - Número de factura generado: ${createdSale.numberInvoice}`);
    console.log(`  - ¿Es secuencial?: ${parseInt(createdSale.numberInvoice) === highestNumber + 1 ? '✅ SÍ' : '❌ NO'}\n`);

    // Test 3: Crear otra venta para verificar que sigue la secuencia
    console.log('📋 Test 3: Crear segunda venta de prueba');
    const secondTestSale = await createSale({
      ...testSaleData,
      items: [
        {
          batchId: 'test-batch-002',
          medicationId: 'test-med-002',
          quantity: 2,
          unitPrice: 15.00,
          total: 30.00
        }
      ],
      total: 30.00
    });

    console.log(`  - Segunda venta creada con ID: ${secondTestSale.id}`);
    console.log(`  - Número de factura generado: ${secondTestSale.numberInvoice}`);
    console.log(`  - ¿Es secuencial?: ${parseInt(secondTestSale.numberInvoice) === parseInt(createdSale.numberInvoice) + 1 ? '✅ SÍ' : '❌ NO'}\n`);

    // Test 4: Verificar el nuevo número más alto
    console.log('📋 Test 4: Verificar nuevo número más alto');
    const newHighestNumber = await repository.getHighestInvoiceNumber();
    console.log(`  - Nuevo número más alto: ${newHighestNumber.toString().padStart(7, '0')}`);
    console.log(`  - Incremento correcto: ${newHighestNumber === highestNumber + 2 ? '✅ SÍ' : '❌ NO'}\n`);

    console.log('🎉 Pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar las pruebas
testInvoiceNumberGeneration().catch(console.error);