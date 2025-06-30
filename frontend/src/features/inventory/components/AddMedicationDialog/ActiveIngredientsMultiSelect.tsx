import { memo, useCallback, useState, useMemo, useEffect } from "react";
import { Badge } from "../../../../shared/components/ui/badge";
import { Button } from "../../../../shared/components/ui/button";
import { X, Plus, Loader2 } from "lucide-react";
import CreatableSelect from "../../../../shared/components/CreatableSelect";
import { 
  createActiveIngredient,
  findActiveIngredientsPaginated,
  searchActiveIngredients
} from "../../../../shared/services";
import type { ActiveIngredient } from "../../../../shared/types/Medication";
import { useActiveIngredients } from "./useActiveIngredients.ts";

interface ActiveIngredientsMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

const ActiveIngredientsMultiSelect = memo(({
  selectedIds,
  onChange,
  error
}: ActiveIngredientsMultiSelectProps) => {
  const [showSelector, setShowSelector] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<ActiveIngredient[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Use custom hook to manage selected active ingredients
  const { selectedIngredients, setSelectedIngredients, loading } = useActiveIngredients(selectedIds);

  // Load initial ingredients for selector
  useEffect(() => {
    const loadInitialIngredients = async () => {
      try {
        setLoadingInitial(true);
        const response = await findActiveIngredientsPaginated(1, 10);
        setAvailableIngredients(response.items);
      } catch (error) {
        console.error("Error loading initial active ingredients:", error);
        setAvailableIngredients([]);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialIngredients();
  }, []);

  // Optimized search function with pagination
  const searchIngredients = useCallback(async (query: string): Promise<ActiveIngredient[]> => {
    try {
      if (!query.trim()) {
        // Return initial ingredients if no search query
        return availableIngredients.filter(ingredient => !selectedIds.includes(ingredient.id));
      }
      
      const results = await searchActiveIngredients(query);
      // Filter out already selected ingredients
      return results.filter(ingredient => !selectedIds.includes(ingredient.id));
    } catch (error) {
      console.error("Error searching active ingredients:", error);
      return [];
    }
  }, [selectedIds, availableIngredients]);

  // Create function
  const handleCreateIngredient = useCallback(async (name: string): Promise<ActiveIngredient> => {
    const newIngredient = await createActiveIngredient({ name, createdBy: "current-user" });
    // Add to available ingredients for future searches
    setAvailableIngredients(prev => [...prev, newIngredient]);
    return newIngredient;
  }, []);

  // Add ingredient to selection
  const handleAddIngredient = useCallback((ingredient: ActiveIngredient) => {
    if (!selectedIds.includes(ingredient.id)) {
      const newSelectedIngredients = [...selectedIngredients, ingredient];
      const newSelectedIds = [...selectedIds, ingredient.id];
      
      setSelectedIngredients(newSelectedIngredients);
      onChange(newSelectedIds);
    }
    setShowSelector(false);
  }, [selectedIds, selectedIngredients, onChange, setSelectedIngredients]);

  // Remove ingredient from selection
  const handleRemoveIngredient = useCallback((ingredientId: string) => {
    const newSelectedIngredients = selectedIngredients.filter(ing => ing.id !== ingredientId);
    const newSelectedIds = selectedIds.filter(id => id !== ingredientId);
    
    setSelectedIngredients(newSelectedIngredients);
    onChange(newSelectedIds);
  }, [selectedIds, selectedIngredients, onChange, setSelectedIngredients]);

  // Memoized selected ingredients display
  const selectedIngredientsDisplay = useMemo(() => 
    selectedIngredients.map(ingredient => (
      <Badge 
        key={ingredient.id} 
        variant="secondary" 
        className="flex items-center gap-2 text-sm py-1 px-2"
      >
        {ingredient.name}
        <button
          type="button"
          onClick={() => handleRemoveIngredient(ingredient.id)}
          className="ml-1 hover:text-red-600 focus:outline-none"
          aria-label={`Eliminar ${ingredient.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    )), 
    [selectedIngredients, handleRemoveIngredient]
  );

  if (loading || loadingInitial) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Principios Activos *
        </label>
        <div className="flex items-center justify-center p-4 border border-dashed rounded-md">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Cargando principios activos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Principios Activos *
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSelector(!showSelector)}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Selected ingredients display */}
      {selectedIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50">
          {selectedIngredientsDisplay}
        </div>
      )}

      {/* No ingredients selected */}
      {selectedIngredients.length === 0 && (
        <div className="p-3 border border-dashed rounded-md text-center text-gray-500 text-sm">
          No hay principios activos seleccionados
        </div>
      )}

      {/* Ingredient selector */}
      {showSelector && (
        <div className="border rounded-md p-3 bg-white">
          <CreatableSelect<ActiveIngredient>
            label=""
            hideLabel={true}
            values={availableIngredients.filter(ingredient => !selectedIds.includes(ingredient.id))}
            selectedValue={null}
            onChange={handleAddIngredient}
            searchFunction={searchIngredients}
            onAddValue={handleCreateIngredient}
            displayField="name"
            valueField="id"
            placeholder="Buscar principio activo..."
          />
          <div className="flex justify-end mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSelector(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Agrega uno o más principios activos que componen este medicamento
      </p>
    </div>
  );
});

ActiveIngredientsMultiSelect.displayName = "ActiveIngredientsMultiSelect";

export default ActiveIngredientsMultiSelect;
