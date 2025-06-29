import { useState, useCallback } from "react";
import {
  findAllMedicationCategories,
  findAllPharmaceuticalForms,
  findAllManufacturers,
  findAllActiveIngredients,
} from "@/shared/services";
import { findAllGenericNames } from "@/shared/services/GenericNameService";
import type {
  MedicationCategory,
  PharmaceuticalFormDoc,
  Manufacturer,
  ActiveIngredient,
  GenericNameDoc,
} from "@/shared/types/Medication";

export const useCatalogs = () => {
  const [categories, setCategories] = useState<MedicationCategory[]>([]);
  const [pharmaceuticalForms, setPharmaceuticalForms] = useState<PharmaceuticalFormDoc[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [activeIngredients, setActiveIngredients] = useState<ActiveIngredient[]>([]);
  const [genericNames, setGenericNames] = useState<GenericNameDoc[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCatalogs = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const [
        categoriesRes,
        formsRes,
        manufacturersRes,
        ingredientsRes,
        genericNamesRes,
      ] = await Promise.all([
        findAllMedicationCategories(),
        findAllPharmaceuticalForms(),
        findAllManufacturers(),
        findAllActiveIngredients(),
        findAllGenericNames(),
      ]);

      setCategories(categoriesRes);
      setPharmaceuticalForms(formsRes);
      setManufacturers(manufacturersRes);
      setActiveIngredients(ingredientsRes);
      setGenericNames(genericNamesRes);
    } catch (error) {
      alert("Error cargando datos, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return {
    categories,
    setCategories,
    pharmaceuticalForms,
    setPharmaceuticalForms,
    manufacturers,
    setManufacturers,
    activeIngredients,
    setActiveIngredients,
    genericNames,
    setGenericNames,
    loadCatalogs,
    loading,
  };
};
