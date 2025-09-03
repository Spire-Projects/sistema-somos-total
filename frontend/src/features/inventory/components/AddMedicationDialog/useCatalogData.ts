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
    // Evitar cargar si no hay IDs
    if (!categoryId && !manufacturerId && !pharmaceuticalFormId) {
      setSelectedValues({
        category: null,
        manufacturer: null,
        pharmaceuticalForm: null
      });
      return;
    }

    setLoading(true);
    try {
      const promises = [];
      
      // Solo hacer llamadas para los IDs que existen
      if (categoryId) promises.push(findMedicationCategoryById(categoryId));
      else promises.push(Promise.resolve(null));
      
      if (manufacturerId) promises.push(findManufacturerById(manufacturerId));
      else promises.push(Promise.resolve(null));
      
      if (pharmaceuticalFormId) promises.push(findPharmaceuticalFormById(pharmaceuticalFormId));
      else promises.push(Promise.resolve(null));

      const [category, manufacturer, pharmaceuticalForm] = await Promise.all(promises);

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
