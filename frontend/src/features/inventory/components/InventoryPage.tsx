import { useCallback } from 'react';
import { AddMedicationDialog } from './AddMedicationDialog';

export const InventoryPage = () => {
  const handleMedicationAdded = useCallback(() => {
    // TODO: Aquí se puede implementar la lógica para recargar la lista de medicamentos
    console.log('Medicamento agregado exitosamente - refrescar lista');
    // Por ejemplo: refetch de la query de medicamentos
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestión de medicamentos y control de stock</p>
        </div>
        <AddMedicationDialog onMedicationAdded={handleMedicationAdded} />
      </div>
      
      {/* Contenido del inventario */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500 text-center">
          Lista de medicamentos aparecerá aquí...
        </p>
      </div>
    </div>
  );
};
