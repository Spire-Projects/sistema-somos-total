import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { FilterTabs, type FilterOption } from '../../../shared/components/FilterTabs';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";
import { Badge } from "../../../shared/components/ui/badge";
import { Skeleton } from "../../../shared/components/ui/skeleton";

export const SettingsPage = () => {
  const [activeIngredients, setActiveIngredients] = useState<ActiveIngredient[]>([]);
  const [categories, setCategories] = useState<MedicationCategory[]>([]);
  const [pharmaceuticalForms, setPharmaceuticalForms] = useState<PharmaceuticalFormDoc[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  
  // Estado para el tab activo
  const [activeTab, setActiveTab] = useState('ingredients');

  // Opciones para los filtros/tabs
  const tabOptions: FilterOption[] = [
    { value: 'categories', label: 'Categorías', icon: '🏷️', count: categories.length },
    { value: 'forms', label: 'Formas Farm.', icon: '💊', count: pharmaceuticalForms.length },
    { value: 'manufacturers', label: 'Fabricantes', icon: '🏭', count: manufacturers.length },
  ];

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

  

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Configuración</h1>
        <Card>
          <CardHeader>
            <CardTitle>Cargando datos</CardTitle>
            <CardDescription>Espere mientras se cargan los datos del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="!text-xl font-bold text-gray-900">Configuración del Sistema</h1>
      
      </div>

      {/* Resumen de datos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{categories.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Formas Farmacéuticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{pharmaceuticalForms.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fabricantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{manufacturers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido en pestañas */}
      <div className="space-y-6">
        <FilterTabs
          options={tabOptions}
          activeFilter={activeTab}
          onFilterChange={setActiveTab}
          className="w-full"
        />
        
        {/* Contenido dinámico basado en el tab activo */}
        {activeTab === 'ingredients' && (
        <Card>
          <CardHeader>
            <CardTitle>🧪 Ingredientes Activos ({activeIngredients.length})</CardTitle>
            <CardDescription>Principios activos registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeIngredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{ingredient.aliases?.join(', ') || '-'}</TableCell>
                    <TableCell>
                      {ingredient.createdAt ? new Date(ingredient.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>🏷️ Categorías de Medicamentos ({categories.length})</CardTitle>
            <CardDescription>Categorías para clasificar los medicamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{category.description}</p>
                    {category.createdAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        Creado: {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'forms' && (
        <Card>
          <CardHeader>
            <CardTitle>💊 Formas Farmacéuticas ({pharmaceuticalForms.length})</CardTitle>
            <CardDescription>Presentaciones disponibles para los medicamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pharmaceuticalForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>{form.aliases?.join(', ') || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{form.description || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={form.isDeleted ? "destructive" : form.sincronized ? "default" : "secondary"}
                      >
                        {form.isDeleted ? 'Eliminado' : form.sincronized ? 'Sincronizado' : 'Local'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'manufacturers' && (
        <Card>
          <CardHeader>
            <CardTitle>🏭 Fabricantes ({manufacturers.length})</CardTitle>
            <CardDescription>Laboratorios y fabricantes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {manufacturers.map((manufacturer) => (
                <Card key={manufacturer.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{manufacturer.name}</CardTitle>
                      <Badge
                        variant={manufacturer.isDeleted ? "destructive" : manufacturer.sincronized ? "default" : "secondary"}
                      >
                        {manufacturer.isDeleted ? 'Eliminado' : manufacturer.sincronized ? 'Sincronizado' : 'Local'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};
