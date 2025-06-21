import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui/button';
import {
  findAllActiveIngredients,
  findAllMedicationCategories,
  findAllPharmaceuticalForms,
  findAllManufacturers
} from '../../../shared/services';
import { initializeMedicationData } from '../../../shared/utils/init-data.utils';
import type { 
  ActiveIngredient, 
  MedicationCategory, 
  PharmaceuticalFormDoc, 
  Manufacturer 
} from '../../../shared/types/Medication';

export const SettingsPage = () => {
  const [activeIngredients, setActiveIngredients] = useState<ActiveIngredient[]>([]);
  const [categories, setCategories] = useState<MedicationCategory[]>([]);
  const [pharmaceuticalForms, setPharmaceuticalForms] = useState<PharmaceuticalFormDoc[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ingredientsData, categoriesData, formsData, manufacturersData] = await Promise.all([
        findAllActiveIngredients(),
        findAllMedicationCategories(),
        findAllPharmaceuticalForms(),
        findAllManufacturers()
      ]);

      setActiveIngredients(ingredientsData);
      setCategories(categoriesData);
      setPharmaceuticalForms(formsData);
      setManufacturers(manufacturersData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeData = async () => {
    setInitializing(true);
    try {
      await initializeMedicationData();
      await loadData();
      console.log('✅ Datos inicializados correctamente');
    } catch (error) {
      console.error('❌ Error inicializando datos:', error);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <Button 
          onClick={handleInitializeData} 
          disabled={initializing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {initializing ? 'Inicializando...' : 'Recargar Datos Iniciales'}
        </Button>
      </div>

      {/* Resumen de datos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900">Ingredientes Activos</h3>
          <p className="text-2xl font-bold text-blue-600">{activeIngredients.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900">Categorías</h3>
          <p className="text-2xl font-bold text-green-600">{categories.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900">Formas Farmacéuticas</h3>
          <p className="text-2xl font-bold text-purple-600">{pharmaceuticalForms.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900">Fabricantes</h3>
          <p className="text-2xl font-bold text-orange-600">{manufacturers.length}</p>
        </div>
      </div>

      {/* Ingredientes Activos */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">🧪 Ingredientes Activos ({activeIngredients.length})</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeIngredients.map((ingredient) => (
                  <tr key={ingredient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ingredient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ingredient.aliases?.join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ingredient.createdAt ? new Date(ingredient.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">🏷️ Categorías de Medicamentos ({categories.length})</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
                {category.createdAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Creado: {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formas Farmacéuticas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">💊 Formas Farmacéuticas ({pharmaceuticalForms.length})</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pharmaceuticalForms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {form.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.aliases?.join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {form.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        form.isDeleted 
                          ? 'bg-red-100 text-red-800' 
                          : form.sincronized 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {form.isDeleted ? 'Eliminado' : form.sincronized ? 'Sincronizado' : 'Local'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fabricantes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">🏭 Fabricantes ({manufacturers.length})</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manufacturers.map((manufacturer) => (
              <div key={manufacturer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{manufacturer.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    manufacturer.isDeleted 
                      ? 'bg-red-100 text-red-800' 
                      : manufacturer.sincronized 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {manufacturer.isDeleted ? 'Eliminado' : manufacturer.sincronized ? 'Sincronizado' : 'Local'}
                  </span>
                </div>
                
                {manufacturer.country && (
                  <p className="text-sm text-gray-600 mb-1">📍 {manufacturer.country}</p>
                )}
                
                {manufacturer.contactEmail && (
                  <p className="text-sm text-gray-600 mb-1">📧 {manufacturer.contactEmail}</p>
                )}
                
                {manufacturer.website && (
                  <a 
                    href={manufacturer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mb-1 block"
                  >
                    🌐 {manufacturer.website}
                  </a>
                )}
                
                {manufacturer.createdAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Creado: {new Date(manufacturer.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
