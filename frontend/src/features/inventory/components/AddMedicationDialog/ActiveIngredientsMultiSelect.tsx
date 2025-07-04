import { useState, useMemo, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { Textarea } from "../../../../shared/components/ui/textarea";

interface ActiveIngredientsMultiSelectProps {
  onChange: (ids: string[]) => void;
  selected?: string[];
  error?: string;
}

const ActiveIngredientsMultiSelect = ({
  onChange,
  selected = [],
  error,
}: ActiveIngredientsMultiSelectProps) => {
  const [ingredientsText, setIngredientsText] = useState<string>("");

  useEffect(() => {
    setIngredientsText(selected.join("\n"));
  }, [selected]);

  const ingredientsList = useMemo(() => {
    const list = ingredientsText
      .split("\n")
      .filter((ingredient) => ingredient.trim() !== "")
      .map((ingredient) => ingredient.trim());
    onChange(list);
    return list;
  }, [ingredientsText]);

  const handleRemoveIngredient = useCallback(
    (index: number) => {
      const updatedList = [...ingredientsList];
      updatedList.splice(index, 1);
      setIngredientsText(updatedList.join("\n"));
      onChange(updatedList);
    },
    [ingredientsList, onChange]
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.shiftKey === false) {
      event.preventDefault();
      setIngredientsText((prev) => prev + "\n");
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Principios Activos *
        </label>
      </div>

      <div className="space-y-2">
        <Textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
          placeholder="Agrega los principios activos, cada uno en una nueva línea"
        />
      </div>

      <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50">
        {ingredientsList.map((ingredient, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-gray-200 px-2 py-1 rounded-md"
          >
            <span className="text-sm">{`- ${ingredient}`}</span>
            <button
              type="button"
              onClick={() => handleRemoveIngredient(index)}
              className="ml-1 hover:text-red-600 focus:outline-none"
              aria-label={`Eliminar ${ingredient}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-gray-500">
        Agrega uno o más principios activos que componen este medicamento
      </p>
    </div>
  );
};

ActiveIngredientsMultiSelect.displayName = "ActiveIngredientsMultiSelect";

export default ActiveIngredientsMultiSelect;
