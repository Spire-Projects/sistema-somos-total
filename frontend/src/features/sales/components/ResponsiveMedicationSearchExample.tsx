/**
 * Ejemplo de uso del MedicationSearch responsivo
 * Demuestra cómo el componente se adapta a diferentes tamaños de contenedor
 */

import { useState } from 'react';
import MedicationSearch from './MedicationSearch';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

export default function ResponsiveMedicationSearchExample() {
  const [selectedMedication, setSelectedMedication] = useState<MedicationCatalogView | null>(null);

  const handleMedicationSelect = (medication: MedicationCatalogView) => {
    setSelectedMedication(medication);
    console.log('Medicamento seleccionado:', medication);
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Ejemplos de MedicationSearch Responsivo</h1>
      
      {/* Ejemplo 1: Ancho completo */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">1. Ancho completo (100% del contenedor)</h2>
        <div className="w-full border-2 border-dashed border-gray-300 p-4 rounded-lg">
          <MedicationSearch
            onMedicationSelect={handleMedicationSelect}
            placeholder="Buscar medicamento - Ancho completo..."
            className="w-full"
          />
        </div>
      </div>

      {/* Ejemplo 2: Ancho fijo en desktop, completo en mobile */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">2. Ancho adaptativo (600px en desktop, 100% en mobile)</h2>
        <div className="w-full sm:w-[600px] border-2 border-dashed border-blue-300 p-4 rounded-lg">
          <MedicationSearch
            onMedicationSelect={handleMedicationSelect}
            placeholder="Buscar medicamento - Ancho adaptativo..."
            className="w-full"
          />
        </div>
      </div>

      {/* Ejemplo 3: En un grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">3. En un grid responsivo</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-green-300 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Columna 1</h3>
            <MedicationSearch
              onMedicationSelect={handleMedicationSelect}
              placeholder="Buscar en grid..."
              className="w-full"
            />
          </div>
          <div className="border-2 border-dashed border-green-300 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Columna 2</h3>
            <MedicationSearch
              onMedicationSelect={handleMedicationSelect}
              placeholder="Buscar en grid..."
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Ejemplo 4: En un modal o contenedor pequeño */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">4. En contenedor pequeño (simulando modal)</h2>
        <div className="max-w-sm mx-auto border-2 border-dashed border-purple-300 p-4 rounded-lg">
          <MedicationSearch
            onMedicationSelect={handleMedicationSelect}
            placeholder="Buscar en modal..."
            className="w-full"
          />
        </div>
      </div>

      {/* Ejemplo 5: Con flex container */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">5. En flex container</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <span className="text-sm font-medium whitespace-nowrap">Medicamento:</span>
          <div className="flex-1 border-2 border-dashed border-red-300 p-2 rounded-lg">
            <MedicationSearch
              onMedicationSelect={handleMedicationSelect}
              placeholder="Flex container..."
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Mostrar selección actual */}
      {selectedMedication && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Último medicamento seleccionado:</h3>
          <p className="text-sm text-green-700">
            <strong>Nombre:</strong> {selectedMedication.tradeName}
          </p>
          <p className="text-sm text-green-700">
            <strong>Genérico:</strong> {selectedMedication.genericName}
          </p>
          <p className="text-sm text-green-700">
            <strong>Stock:</strong> {selectedMedication.totalActiveStock} unidades
          </p>
        </div>
      )}
    </div>
  );
}
