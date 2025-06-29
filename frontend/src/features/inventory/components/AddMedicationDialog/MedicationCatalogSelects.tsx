import { memo, useCallback } from "react";
import type { FieldErrors } from "react-hook-form";
import { Loader2 } from "lucide-react";
import CreatableSelect from "../../../../shared/components/CreatableSelect";
import { 
  searchMedicationCategories,
  createMedicationCategory,
  searchManufacturers,
  createManufacturer,
  searchPharmaceuticalForms,
  createPharmaceuticalForm
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

  // Use custom hook to load catalog data
  const { selectedValues, loading } = useCatalogData(
    categoryId,
    genericName,
    manufacturerId,
    pharmaceuticalFormId
  );

  // Optimized search functions with caching
  const searchCategories = useCallback(async (query: string): Promise<MedicationCategory[]> => {
    try {
      return await searchMedicationCategories(query);
    } catch (error) {
      console.error("Error searching categories:", error);
      return [];
    }
  }, []);

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
      return await searchManufacturers(query);
    } catch (error) {
      console.error("Error searching manufacturers:", error);
      return [];
    }
  }, []);

  const searchPharmaceuticalFormsList = useCallback(async (query: string): Promise<PharmaceuticalFormDoc[]> => {
    try {
      return await searchPharmaceuticalForms(query);
    } catch (error) {
      console.error("Error searching pharmaceutical forms:", error);
      return [];
    }
  }, []);

  // Create functions
  const handleCreateCategory = useCallback(async (name: string): Promise<MedicationCategory> => {
    return await createMedicationCategory({ name, createdBy: "current-user" });
  }, []);

  const handleCreateGeneric = useCallback(async (name: string): Promise<GenericNameDoc> => {
    return await createGenericName({ name, createdBy: "current-user" });
  }, []);

  const handleCreateManufacturer = useCallback(async (name: string): Promise<Manufacturer> => {
    return await createManufacturer({ name, createdBy: "current-user" });
  }, []);

  const handleCreatePharmaceuticalForm = useCallback(async (name: string): Promise<PharmaceuticalFormDoc> => {
    return await createPharmaceuticalForm({ name, createdBy: "current-user" });
  }, []);

  if (loading) {
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
            values={[]}
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
            values={[]}
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
            values={[]}
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
