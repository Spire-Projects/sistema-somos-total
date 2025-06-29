import { memo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/shared/components/ui/checkbox";
import type { ActiveIngredient } from "@/shared/types/Medication";
import type { MedicationFormData } from "../hooks/useMedicationForm";

interface ActiveIngredientsProps {
  form: UseFormReturn<MedicationFormData>;
  activeIngredients: ActiveIngredient[];
}

const ActiveIngredientsSection = ({ form, activeIngredients }: ActiveIngredientsProps) => {
  const { watch, setValue } = form;
  const activeIngredientIds = watch("activeIngredientIds");

  const handleToggle = (ingredientId: string) => {
    const currentIds = activeIngredientIds || [];
    const newIds = currentIds.includes(ingredientId)
      ? currentIds.filter((id) => id !== ingredientId)
      : [...currentIds, ingredientId];
    setValue("activeIngredientIds", newIds);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Principios Activos
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
        {activeIngredients.map((ingredient) => (
          <div key={ingredient.id} className="flex items-center space-x-2">
            <Checkbox
              id={ingredient.id}
              checked={activeIngredientIds?.includes(ingredient.id) || false}
              onCheckedChange={() => handleToggle(ingredient.id)}
            />
            <label
              htmlFor={ingredient.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {ingredient.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(ActiveIngredientsSection);
