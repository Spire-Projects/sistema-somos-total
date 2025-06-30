import { useState, useEffect, useCallback } from "react";
import {
  findMedicationCategoryById,
  findManufacturerById,
  findPharmaceuticalFormById
} from "../../../../shared/services";
import type { 
  MedicationCategory, 
  Manufacturer, 
  PharmaceuticalFormDoc 
} from "../../../../shared/types/Medication";

interface CatalogSelectedValues {
  category: MedicationCategory | null;
  manufacturer: Manufacturer | null;
  pharmaceuticalForm: PharmaceuticalFormDoc | null;
}

export const useCatalogData = (
  categoryId: string,
  manufacturerId: string,
  pharmaceuticalFormId: string
) => {
  const [selectedValues, setSelectedValues] = useState<CatalogSelectedValues>({
    category: null,
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

      setSelectedValues({
        category,
        manufacturer,
        pharmaceuticalForm
      });
    } catch (error) {
      console.error("Error loading catalog data:", error);
      setSelectedValues({
        category: null,
        manufacturer: null,
        pharmaceuticalForm: null
      });
    } finally {
      setLoading(false);
    }
  }, [categoryId, manufacturerId, pharmaceuticalFormId]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  return {
    selectedValues,
    loading
  };
};
