import { useState, useCallback, useEffect, useRef } from "react";
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
  const [localIngredients, setLocalIngredients] = useState<string[]>(selected || []);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (!isInternalChange.current && JSON.stringify(selected) !== JSON.stringify(localIngredients)) {
      setLocalIngredients(selected);
    }
    isInternalChange.current = false;
  }, [selected, localIngredients]);

  const notifyChanges = useCallback((ingredients: string[]) => {
    isInternalChange.current = true;
    onChange(ingredients);
  }, [onChange]);

  const processMultilineText = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line !== "");
    
    const newIngredients = [...localIngredients];
    let added = false;
    
    for (const line of lines) {
      if (!newIngredients.includes(line)) {
        newIngredients.push(line);
        added = true;
      }
    }
    
    if (added) {
      setLocalIngredients(newIngredients);
      notifyChanges(newIngredients);
      setIngredientsText("");
    }
  }, [localIngredients, notifyChanges]);

  const handleAddIngredient = useCallback(() => {
    processMultilineText(ingredientsText);
  }, [ingredientsText, processMultilineText]);

  const handleRemoveIngredient = useCallback(
    (index: number) => {
      const updatedList = [...localIngredients];
      updatedList.splice(index, 1);
      setLocalIngredients(updatedList);
      notifyChanges(updatedList);
    },
    [localIngredients, notifyChanges]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleAddIngredient();
      }
    },
    [handleAddIngredient]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = event.clipboardData.getData('text');
      if (pastedText.includes('\n')) {
        event.preventDefault();
        processMultilineText(pastedText);
      }
    },
    [processMultilineText]
  );

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
          onPaste={handlePaste}
          rows={5}
          placeholder="Agrega los principios activos, cada uno en una nueva línea"
          className="placeholder:text-gray-500"
        />
      </div>

      <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50">
        {localIngredients.map((ingredient, index) => (
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
