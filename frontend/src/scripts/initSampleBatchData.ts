import { initDatabaseAndModels } from '../shared/db/database';
import { createMedication, addMedicationBatch } from '../shared/services/MedicationService';
import type { CreateMedicationData, CreateMedicationBatchData } from '../shared/types/MedicationCrud';

/**
 * Script para inicializar datos de ejemplo en la base de datos
 */
export const initSampleData = async () => {
  try {
    console.log('🔄 Inicializando datos de ejemplo...');
    
    // Inicializar la base de datos
    await initDatabaseAndModels();
    
    // Datos de medicamentos de ejemplo
    const sampleMedications: CreateMedicationData[] = [
      {
        tradeName: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        activeIngredientIds: ['paracetamol-1'],
        pharmaceuticalFormId: 'tablet-1',
        concentration: '500mg',
        presentation: 'Caja x 20 tabletas',
        manufacturerId: 'farmacorp-1',
        categoryId: 'analgesic-1',
        description: 'Analgésico y antipirético de uso común',
        indications: 'Dolor de cabeza, fiebre, dolores musculares',
        warnings: 'No exceder la dosis recomendada',
        createdBy: 'system'
      },
      {
        tradeName: 'Ibuprofeno 400mg',
        genericName: 'Ibuprofeno',
        activeIngredientIds: ['ibuprofeno-1'],
        pharmaceuticalFormId: 'tablet-1',
        concentration: '400mg',
        presentation: 'Caja x 30 tabletas',
        manufacturerId: 'labxyz-1',
        categoryId: 'antiinflamatory-1',
        description: 'Antiinflamatorio no esteroidal',
        indications: 'Dolor, inflamación, fiebre',
        warnings: 'Puede causar irritación gástrica',
        createdBy: 'system'
      },
      {
        tradeName: 'Amoxicilina 500mg',
        genericName: 'Amoxicilina',
        activeIngredientIds: ['amoxicilina-1'],
        pharmaceuticalFormId: 'capsule-1',
        concentration: '500mg',
        presentation: 'Frasco x 21 cápsulas',
        manufacturerId: 'antibioticos-sa-1',
        categoryId: 'antibiotic-1',
        description: 'Antibiótico de amplio espectro',
        indications: 'Infecciones bacterianas',
        warnings: 'Completar todo el tratamiento',
        createdBy: 'system'
      }
    ];

    // Crear medicamentos
    const createdMedications = [];
    for (const medicationData of sampleMedications) {
      try {
        const medication = await createMedication(medicationData);
        createdMedications.push(medication);
        console.log(`✅ Medicamento creado: ${medication.tradeName}`);
      } catch (error) {
        console.log(`ℹ️ Medicamento ya existe: ${medicationData.tradeName}`);
        // Si ya existe, podemos continuar
      }
    }

    // Datos de lotes de ejemplo
    const sampleBatches: (CreateMedicationBatchData & { medicationTradeName: string })[] = [
      {
        medicationTradeName: 'Paracetamol 500mg',
        batchId: 'LOT-PAR-001',
        expirationDate: '2025-12-31',
        quantity: 100,
        purchasePrice: 8.50,
        sellingPrice: 11.05, // 30% margen
        purchaseDate: '2024-01-15',
        supplier: 'Farmacéutica ABC S.A.',
        createdBy: 'system'
      },
      {
        medicationTradeName: 'Paracetamol 500mg',
        batchId: 'LOT-PAR-002',
        expirationDate: '2025-06-30',
        quantity: 75,
        purchasePrice: 9.00,
        sellingPrice: 11.70, // 30% margen
        purchaseDate: '2024-02-20',
        supplier: 'Distribuidora MedPharma',
        createdBy: 'system'
      },
      {
        medicationTradeName: 'Ibuprofeno 400mg',
        batchId: 'LOT-IBU-001',
        expirationDate: '2024-08-30',
        quantity: 50,
        purchasePrice: 12.00,
        sellingPrice: 15.60, // 30% margen
        purchaseDate: '2024-01-10',
        supplier: 'Laboratorios XYZ',
        createdBy: 'system'
      },
      {
        medicationTradeName: 'Ibuprofeno 400mg',
        batchId: 'LOT-IBU-002',
        expirationDate: '2025-03-15',
        quantity: 80,
        purchasePrice: 11.50,
        sellingPrice: 14.95, // 30% margen
        purchaseDate: '2024-03-01',
        supplier: 'Farmacéutica ABC S.A.',
        createdBy: 'system'
      },
      {
        medicationTradeName: 'Amoxicilina 500mg',
        batchId: 'LOT-AMX-001',
        expirationDate: '2024-12-31',
        quantity: 60,
        purchasePrice: 15.00,
        sellingPrice: 19.50, // 30% margen
        purchaseDate: '2024-01-05',
        supplier: 'Antibióticos S.A.',
        createdBy: 'system'
      },
      {
        medicationTradeName: 'Amoxicilina 500mg',
        batchId: 'LOT-AMX-002',
        expirationDate: '2025-09-30',
        quantity: 90,
        purchasePrice: 14.50,
        sellingPrice: 18.85, // 30% margen
        purchaseDate: '2024-03-10',
        supplier: 'Distribuidora MedPharma',
        createdBy: 'system'
      }
    ];

    // Obtener los medicamentos creados para agregar lotes
    const { findAllMedications } = await import('../shared/services/MedicationService');
    const allMedications = await findAllMedications();

    // Agregar lotes a los medicamentos
    for (const batchData of sampleBatches) {
      const medication = allMedications.find(m => m.tradeName === batchData.medicationTradeName);
      if (medication) {
        try {
          const { medicationTradeName, ...batchDataClean } = batchData;
          await addMedicationBatch(medication.id, batchDataClean);
          console.log(`✅ Lote agregado: ${batchData.batchId} para ${medication.tradeName}`);
        } catch (error) {
          console.log(`ℹ️ Lote ya existe: ${batchData.batchId}`);
        }
      }
    }

    console.log('✅ Datos de ejemplo inicializados correctamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error inicializando datos de ejemplo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Función para ejecutar el script si se llama directamente
if (typeof window !== 'undefined') {
  (window as any).initSampleData = initSampleData;
}
