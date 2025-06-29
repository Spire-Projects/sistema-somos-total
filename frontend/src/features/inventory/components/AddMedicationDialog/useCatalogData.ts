import { useState, useEffect, useCallback } from "react";
import {
  findMedicationCategoryById,
  findManufacturerById,
  findPharmaceuticalFormById
} from "../../../../shared/services";
import type { 
  MedicationCategory, 
  GenericNameDoc, 
  Manufacturer, 
  PharmaceuticalFormDoc 
} from "../../../../shared/types/Medication";

interface CatalogSelectedValues {
  category: MedicationCategory | null;
  generic: GenericNameDoc | null;
  manufacturer: Manufacturer | null;
  pharmaceuticalForm: PharmaceuticalFormDoc | null;
}

export const useCatalogData = (
  categoryId: string,
  genericName: string,
  manufacturerId: string,
  pharmaceuticalFormId: string
) => {
  const [selectedValues, setSelectedValues] = useState<CatalogSelectedValues>({
    category: null,
    generic: null,
    manufacturer: null,
    pharmaceuticalForm: null
  });
  const [loading, setLoading] = useState(false);

  const loadCatalogData = useCallback(async () => {
    setLoading(true);
    try {
      const [category, manufacturer, pharmaceuticalForm] = await Promise.all([
        categoryId ? findMedicationCategoryById(categoryId) : null,
        manufacturerId ? findManufacturerById(manufacturerId) : null,
        pharmaceuticalFormId ? findPharmaceuticalFormById(pharmaceuticalFormId) : null,
      ]);

      // For generic name, we create a mock object since it's stored as string
      const generic = genericName ? { 
        id: "", 
        name: genericName,
        createdAt: new Date().toISOString(),
        createdBy: "",
        sincronized: false,
        isDeleted: false
      } as GenericNameDoc : null;

      setSelectedValues({
        category,
        generic,
        manufacturer,
        pharmaceuticalForm
      });
    } catch (error) {
      console.error("Error loading catalog data:", error);
      setSelectedValues({
        category: null,
        generic: null,
        manufacturer: null,
        pharmaceuticalForm: null
      });
    } finally {
      setLoading(false);
    }
  }, [categoryId, genericName, manufacturerId, pharmaceuticalFormId]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  return {
    selectedValues,
    loading
  };
};
