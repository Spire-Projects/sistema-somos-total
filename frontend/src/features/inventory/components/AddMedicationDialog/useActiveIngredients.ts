import { useState, useEffect, useCallback } from "react";
import { findActiveIngredientById } from "../../../../shared/services";
import type { ActiveIngredient } from "../../../../shared/types/Medication";

export const useActiveIngredients = (selectedIds: string[]) => {
  const [selectedIngredients, setSelectedIngredients] = useState<ActiveIngredient[]>([]);
  const [loading, setLoading] = useState(false);

  // Load active ingredients by IDs
  const loadIngredients = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setSelectedIngredients([]);
      return;
    }

    setLoading(true);
    try {
      const ingredients = await Promise.all(
        ids.map(id => findActiveIngredientById(id))
      );
      
      // Filter out null results
      const validIngredients = ingredients.filter(Boolean) as ActiveIngredient[];
      setSelectedIngredients(validIngredients);
    } catch (error) {
      console.error("Error loading active ingredients:", error);
      setSelectedIngredients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update ingredients when IDs change
  useEffect(() => {
    loadIngredients(selectedIds);
  }, [selectedIds, loadIngredients]);

  return {
    selectedIngredients,
    setSelectedIngredients,
    loading,
    reloadIngredients: () => loadIngredients(selectedIds)
  };
};
