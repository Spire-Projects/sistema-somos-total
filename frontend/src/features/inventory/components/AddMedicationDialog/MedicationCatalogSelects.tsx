import { memo, useCallback, useState, useEffect } from "react";
import type { FieldErrors } from "react-hook-form";
import { Loader2 } from "lucide-react";
import CreatableSelect from "../../../../shared/components/CreatableSelect";
import { 
  createMedicationCategory,
  findMedicationCategoriesPaginated,
  createManufacturer,
  findManufacturersPaginated,
  createPharmaceuticalForm,
  findPharmaceuticalFormsPaginated
} from "../../../../shared/services";

// Mock functions for missing services
const searchGenericNames = async (_query: string): Promise<GenericNameDoc[]> => {
  // TODO: Implement actual search
  return [];
};

const createGenericName = async (data: { name: string; createdBy?: string }): Promise<GenericNameDoc> => {
  // TODO: Implement actual creation
  return {
    id: `generic-${Date.now()}`,
    name: data.name,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy || "",
    sincronized: false,
    isDeleted: false
  };
};
import type { 
  MedicationCategory, 
  GenericNameDoc, 
  Manufacturer, 
  PharmaceuticalFormDoc 
} from "../../../../shared/types/Medication";
import type { CreateMedicationData } from "../../../../shared/types/MedicationCrud";
import { useCatalogData } from "./useCatalogData.ts";

interface MedicationCatalogSelectsProps {
  categoryId: string;
  genericName: string;
  manufacturerId: string;
  pharmaceuticalFormId: string;
  onFieldChange: (field: keyof CreateMedicationData, value: any) => void;
  errors: FieldErrors<CreateMedicationData>;
}

const MedicationCatalogSelects = memo(({
  categoryId,
  genericName,
  manufacturerId,
  pharmaceuticalFormId,
  onFieldChange,
  errors
}: MedicationCatalogSelectsProps) => {

  // Estado para las categorías, fabricantes y formas farmacéuticas iniciales
  const [initialCategories, setInitialCategories] = useState<MedicationCategory[]>([]);
  const [initialManufacturers, setInitialManufacturers] = useState<Manufacturer[]>([]);
  const [initialPharmaceuticalForms, setInitialPharmaceuticalForms] = useState<PharmaceuticalFormDoc[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [manufacturersLoading, setManufacturersLoading] = useState(true);
  const [pharmaceuticalFormsLoading, setPharmaceuticalFormsLoading] = useState(true);

  // Use custom hook to load catalog data
  const { selectedValues, loading } = useCatalogData(
    categoryId,
    genericName,
    manufacturerId,
    pharmaceuticalFormId
  );

  // Cargar categorías iniciales (primeras 10)
  useEffect(() => {
    const loadInitialCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await findMedicationCategoriesPaginated(1, 10);
        setInitialCategories(response.items);
      } catch (error) {
        console.error("Error loading initial categories:", error);
        setInitialCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadInitialCategories();
  }, []);

  // Cargar manufacturers iniciales (primeros 10)
  useEffect(() => {
    const loadInitialManufacturers = async () => {
      try {
        setManufacturersLoading(true);
        const response = await findManufacturersPaginated(1, 10);
        setInitialManufacturers(response.items);
      } catch (error) {
        console.error("Error loading initial manufacturers:", error);
        setInitialManufacturers([]);
      } finally {
        setManufacturersLoading(false);
      }
    };

    loadInitialManufacturers();
  }, []);

  // Cargar formas farmacéuticas iniciales (primeras 10)
  useEffect(() => {
    const loadInitialPharmaceuticalForms = async () => {
      try {
        setPharmaceuticalFormsLoading(true);
        const response = await findPharmaceuticalFormsPaginated(1, 10);
        setInitialPharmaceuticalForms(response.items);
      } catch (error) {
        console.error("Error loading initial pharmaceutical forms:", error);
        setInitialPharmaceuticalForms([]);
      } finally {
        setPharmaceuticalFormsLoading(false);
      }
    };

    loadInitialPharmaceuticalForms();
  }, []);

  // Optimized search functions with caching
  const searchCategories = useCallback(async (query: string): Promise<MedicationCategory[]> => {
    try {
      if (!query || query.trim() === "") {
        // Si no hay búsqueda, retornar las categorías iniciales
        return initialCategories;
      }
      
      // Buscar con paginación para obtener máximo 10 resultados
      const response = await findMedicationCategoriesPaginated(1, 10, query);
      return response.items;
    } catch (error) {
      console.error("Error searching categories:", error);
      return [];
    }
  }, [initialCategories]);

  const searchGeneric = useCallback(async (query: string): Promise<GenericNameDoc[]> => {
    try {
      return await searchGenericNames(query);
    } catch (error) {
      console.error("Error searching generic names:", error);
      return [];
    }
  }, []);

  const searchManufacturersList = useCallback(async (query: string): Promise<Manufacturer[]> => {
    try {
      if (!query || query.trim() === "") {
        // Si no hay búsqueda, retornar los manufacturers iniciales
        return initialManufacturers;
      }
      
      // Buscar con paginación para obtener máximo 10 resultados
      const response = await findManufacturersPaginated(1, 10, query);
      return response.items;
    } catch (error) {
      console.error("Error searching manufacturers:", error);
      return [];
    }
  }, [initialManufacturers]);

  const searchPharmaceuticalFormsList = useCallback(async (query: string): Promise<PharmaceuticalFormDoc[]> => {
    try {
      if (!query || query.trim() === "") {
        // Si no hay búsqueda, retornar las formas farmacéuticas iniciales
        return initialPharmaceuticalForms;
      }
      
      // Buscar con paginación para obtener máximo 10 resultados
      const response = await findPharmaceuticalFormsPaginated(1, 10, query);
      return response.items;
    } catch (error) {
      console.error("Error searching pharmaceutical forms:", error);
      return [];
    }
  }, [initialPharmaceuticalForms]);

  // Create functions
  const handleCreateCategory = useCallback(async (name: string): Promise<MedicationCategory> => {
    try {
      const newCategory = await createMedicationCategory({ 
        name, 
        createdBy: "current-user" // TODO: Usar ID del usuario actual
      });
      
      // Actualizar la lista de categorías iniciales con la nueva categoría
      setInitialCategories(prev => [newCategory, ...prev]);
      
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }, []);

  const handleCreateGeneric = useCallback(async (name: string): Promise<GenericNameDoc> => {
    return await createGenericName({ name, createdBy: "current-user" });
  }, []);

  const handleCreateManufacturer = useCallback(async (name: string): Promise<Manufacturer> => {
    try {
      const newManufacturer = await createManufacturer({ 
        name, 
        createdBy: "current-user" // TODO: Usar ID del usuario actual
      });
      
      // Actualizar la lista de manufacturers iniciales con el nuevo manufacturer
      setInitialManufacturers(prev => [newManufacturer, ...prev]);
      
      return newManufacturer;
    } catch (error) {
      console.error("Error creating manufacturer:", error);
      throw error;
    }
  }, []);

  const handleCreatePharmaceuticalForm = useCallback(async (name: string): Promise<PharmaceuticalFormDoc> => {
    try {
      const newForm = await createPharmaceuticalForm({ 
        name, 
        createdBy: "current-user" // TODO: Usar ID del usuario actual
      });
      
      // Actualizar la lista de formas farmacéuticas iniciales con la nueva forma
      setInitialPharmaceuticalForms(prev => [newForm, ...prev]);
      
      return newForm;
    } catch (error) {
      console.error("Error creating pharmaceutical form:", error);
      throw error;
    }
  }, []);

  if (loading || categoriesLoading || manufacturersLoading || pharmaceuticalFormsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Cargando catálogos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categoría */}
        <div className="space-y-2">
          <CreatableSelect<MedicationCategory>
            label="Categoría"
            values={initialCategories}
            selectedValue={selectedValues.category}
            onChange={(category) => onFieldChange('categoryId', category.id)}
            searchFunction={searchCategories}
            onAddValue={handleCreateCategory}
            displayField="name"
            valueField="id"
            placeholder="Seleccionar categoría"
          />
          {errors.categoryId && (
            <p className="text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Nombre Genérico */}
        <div className="space-y-2">
          <CreatableSelect<GenericNameDoc>
            label="Nombre Genérico"
            values={[]}
            selectedValue={selectedValues.generic}
            onChange={(generic) => onFieldChange('genericName', generic.name)}
            searchFunction={searchGeneric}
            onAddValue={handleCreateGeneric}
            displayField="name"
            valueField="id"
            placeholder="Seleccionar nombre genérico"
          />
          {errors.genericName && (
            <p className="text-sm text-red-600">{errors.genericName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Proveedor/Fabricante */}
        <div className="space-y-2">
          <CreatableSelect<Manufacturer>
            label="Proveedor"
            values={initialManufacturers}
            selectedValue={selectedValues.manufacturer}
            onChange={(manufacturer) => onFieldChange('manufacturerId', manufacturer.id)}
            searchFunction={searchManufacturersList}
            onAddValue={handleCreateManufacturer}
            displayField="name"
            valueField="id"
            placeholder="Seleccionar proveedor"
          />
          {errors.manufacturerId && (
            <p className="text-sm text-red-600">{errors.manufacturerId.message}</p>
          )}
        </div>

        {/* Forma Farmacéutica */}
        <div className="space-y-2">
          <CreatableSelect<PharmaceuticalFormDoc>
            label="Forma Farmacéutica"
            values={initialPharmaceuticalForms}
            selectedValue={selectedValues.pharmaceuticalForm}
            onChange={(form) => onFieldChange('pharmaceuticalFormId', form.id)}
            searchFunction={searchPharmaceuticalFormsList}
            onAddValue={handleCreatePharmaceuticalForm}
            displayField="name"
            valueField="id"
            placeholder="Seleccionar forma farmacéutica"
          />
          {errors.pharmaceuticalFormId && (
            <p className="text-sm text-red-600">{errors.pharmaceuticalFormId.message}</p>
          )}
        </div>
      </div>
    </div>
  );
});

MedicationCatalogSelects.displayName = "MedicationCatalogSelects";

export default MedicationCatalogSelects;
