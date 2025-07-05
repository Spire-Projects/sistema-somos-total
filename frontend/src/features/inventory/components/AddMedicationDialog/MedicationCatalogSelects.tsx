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
  findPharmaceuticalFormsPaginated,
  updateMedicationCategory,
  deleteMedicationCategory,
  updateManufacturer,
  deleteManufacturer,
  updatePharmaceuticalForm,
  deletePharmaceuticalForm,
} from "../../../../shared/services";

import type {
  MedicationCategory,
  Manufacturer,
  PharmaceuticalFormDoc,
} from "../../../../shared/types/Medication";
import type { CreateMedicationData } from "../../../../shared/types/MedicationCrud";
import { useCatalogData } from "./useCatalogData.ts";

interface MedicationCatalogSelectsProps {
  categoryId: string;
  manufacturerId: string;
  pharmaceuticalFormId: string;
  onFieldChange: (field: keyof CreateMedicationData, value: any) => void;
  errors: FieldErrors<CreateMedicationData>;
}

const MedicationCatalogSelects = memo(
  ({
    categoryId,
    manufacturerId,
    pharmaceuticalFormId,
    onFieldChange,
    errors,
  }: MedicationCatalogSelectsProps) => {
    // Estado para las categorías, fabricantes y formas farmacéuticas iniciales
    const [initialCategories, setInitialCategories] = useState<
      MedicationCategory[]
    >([]);
    const [initialManufacturers, setInitialManufacturers] = useState<
      Manufacturer[]
    >([]);
    const [initialPharmaceuticalForms, setInitialPharmaceuticalForms] =
      useState<PharmaceuticalFormDoc[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [manufacturersLoading, setManufacturersLoading] = useState(true);
    const [pharmaceuticalFormsLoading, setPharmaceuticalFormsLoading] =
      useState(true);

    // Use custom hook to load catalog data
    const { selectedValues, loading } = useCatalogData(
      categoryId,
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

    const searchCategories = useCallback(
      async (query: string): Promise<MedicationCategory[]> => {
        try {
          if (!query || query.trim() === "") {
            // Si no hay búsqueda, retornar las categorías iniciales
            return initialCategories;
          }

          // Buscar con paginación para obtener máximo 10 resultados
          const response = await findMedicationCategoriesPaginated(
            1,
            10,
            query
          );
          return response.items;
        } catch (error) {
          console.error("Error searching categories:", error);
          return [];
        }
      },
      [initialCategories]
    );

    const searchManufacturersList = useCallback(
      async (query: string): Promise<Manufacturer[]> => {
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
      },
      [initialManufacturers]
    );

    const searchPharmaceuticalFormsList = useCallback(
      async (query: string): Promise<PharmaceuticalFormDoc[]> => {
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
      },
      [initialPharmaceuticalForms]
    );

    // Create functions
    const handleCreateCategory = useCallback(
      async (name: string): Promise<MedicationCategory> => {
        try {
          const newCategory = await createMedicationCategory({
            name,
            createdBy: "current-user", // TODO: Usar ID del usuario actual
          });

          // Actualizar la lista de categorías iniciales con la nueva categoría
          setInitialCategories((prev) => [newCategory, ...prev]);

          return newCategory;
        } catch (error) {
          console.error("Error creating category:", error);
          throw error;
        }
      },
      []
    );

    const handleEditCategory = async (
      updated: MedicationCategory
    ): Promise<MedicationCategory | null> => {
      const edited = await updateMedicationCategory(updated.id, {
        name: updated.name,
      });
      if (edited)
        setInitialCategories((prev) =>
          prev.map((item) => (item.id === edited.id ? edited : item))
        );
      return edited;
    };

    // Eliminar
    const handleDeleteCategory = async (item: MedicationCategory) => {
      await deleteMedicationCategory(item.id);
      setInitialCategories((prev) => prev.filter((c) => c.id !== item.id));
    };

    const handleCreateManufacturer = useCallback(
      async (name: string): Promise<Manufacturer> => {
        try {
          const newManufacturer = await createManufacturer({
            name,
            createdBy: "current-user", // TODO: Usar ID del usuario actual
          });

          // Actualizar la lista de manufacturers iniciales con el nuevo manufacturer
          setInitialManufacturers((prev) => [newManufacturer, ...prev]);

          return newManufacturer;
        } catch (error) {
          console.error("Error creating manufacturer:", error);
          throw error;
        }
      },
      []
    );

    const handleEditManufacturer = useCallback(
      async (updated: Manufacturer): Promise<Manufacturer | null> => {
        try {
          const edited = await updateManufacturer(updated.id, {
            name: updated.name,
          });

          if(!edited) return null

          setInitialManufacturers((prev) =>
            prev.map((item) => (item.id === edited.id ? edited : item))
          );

          return edited;
        } catch (error) {
          console.error("Error editing manufacturer:", error);
          throw error;
        }
      },
      []
    );

    const handleDeleteManufacturer = useCallback(async (item: Manufacturer) => {
      try {
        await deleteManufacturer(item.id);

        setInitialManufacturers((prev) => prev.filter((i) => i.id !== item.id));
      } catch (error) {
        console.error("Error deleting manufacturer:", error);
      }
    }, []);

    const handleCreatePharmaceuticalForm = useCallback(
      async (name: string): Promise<PharmaceuticalFormDoc> => {
        try {
          const newForm = await createPharmaceuticalForm({
            name,
            createdBy: "current-user", // TODO: Usar ID del usuario actual
          });

          // Actualizar la lista de formas farmacéuticas iniciales con la nueva forma
          setInitialPharmaceuticalForms((prev) => [newForm, ...prev]);

          return newForm;
        } catch (error) {
          console.error("Error creating pharmaceutical form:", error);
          throw error;
        }
      },
      []
    );

    const handleEditPharmaceuticalForm = useCallback(
      async (updated: PharmaceuticalFormDoc): Promise<PharmaceuticalFormDoc | null> => {
        try {
          const edited = await updatePharmaceuticalForm(updated.id, {
            name: updated.name,
          });

          if(!edited) return null;
    
          setInitialPharmaceuticalForms((prev) =>
            prev.map((item) => (item.id === edited.id ? edited : item))
          );
    
          return edited;
        } catch (error) {
          console.error("Error editing pharmaceutical form:", error);
          throw error;
        }
      },
      []
    );
    
    const handleDeletePharmaceuticalForm = useCallback(
      async (item: PharmaceuticalFormDoc) => {
        try {
          await deletePharmaceuticalForm(item.id);
    
          setInitialPharmaceuticalForms((prev) =>
            prev.filter((i) => i.id !== item.id)
          );
        } catch (error) {
          console.error("Error deleting pharmaceutical form:", error);
        }
      },
      []
    );
    

    if (
      loading ||
      categoriesLoading ||
      manufacturersLoading ||
      pharmaceuticalFormsLoading
    ) {
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
              label="Categoría del Medicamento"
              values={initialCategories}
              selectedValue={selectedValues.category}
              onChange={(category) => onFieldChange("categoryId", category.id)}
              searchFunction={searchCategories}
              onAddValue={handleCreateCategory}
              displayField="name"
              valueField="id"
              placeholder="Ej: Analgésicos, Antibióticos, Vitaminas"
              onEditValue={handleEditCategory}
              onDeleteValue={handleDeleteCategory}
            />
            {errors.categoryId && (
              <p className="text-sm text-red-600">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Proveedor/Fabricante */}
          <div className="space-y-2">
            <CreatableSelect<Manufacturer>
              label="Fabricante/Laboratorio"
              values={initialManufacturers}
              selectedValue={selectedValues.manufacturer}
              onChange={(manufacturer) =>
                onFieldChange("manufacturerId", manufacturer.id)
              }
              searchFunction={searchManufacturersList}
              onAddValue={handleCreateManufacturer}
              onEditValue={handleEditManufacturer}
              onDeleteValue={handleDeleteManufacturer}
              displayField="name"
              valueField="id"
              placeholder="Ej: Bayer, Pfizer, Genfar, MK"
            />
            {errors.manufacturerId && (
              <p className="text-sm text-red-600">
                {errors.manufacturerId.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Forma Farmacéutica */}
          <div className="space-y-2">
            <CreatableSelect<PharmaceuticalFormDoc>
              label="Forma Farmacéutica"
              values={initialPharmaceuticalForms}
              selectedValue={selectedValues.pharmaceuticalForm}
              onChange={(form) =>
                onFieldChange("pharmaceuticalFormId", form.id)
              }
              searchFunction={searchPharmaceuticalFormsList}
              onAddValue={handleCreatePharmaceuticalForm}
              onEditValue={handleEditPharmaceuticalForm}
              onDeleteValue={handleDeletePharmaceuticalForm}
              displayField="name"
              valueField="id"
              placeholder="Ej: Tabletas, Cápsulas, Jarabe, Inyectable, Crema"
            />
            {errors.pharmaceuticalFormId && (
              <p className="text-sm text-red-600">
                {errors.pharmaceuticalFormId.message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MedicationCatalogSelects.displayName = "MedicationCatalogSelects";

export default MedicationCatalogSelects;
