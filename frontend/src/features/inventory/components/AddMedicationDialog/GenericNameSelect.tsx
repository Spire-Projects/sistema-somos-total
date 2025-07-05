import { memo, useCallback, useEffect, useState } from "react";
import CreatableSelect from "@/shared/components/CreatableSelect";
import type { GenericNameDoc } from "@/shared/types/Medication";
import {
  createGenericName,
  deleteGenericName,
  findGenericNameById,
  findGenericNamesPaginated,
  updateGenericName,
} from "@/shared/services/GenericNameService";

interface GenericNameSelectProps {
  selectedId: string;
  onChange: (genericName: GenericNameDoc) => void;
  error?: string;
}

const GenericNameSelect = memo(
  ({ onChange, error, selectedId }: GenericNameSelectProps) => {
    const [initialGenericNames, setInitialGenericNames] = useState<
      GenericNameDoc[]
    >([]);
    const [selected, setSelected] = useState<GenericNameDoc | null>(null);

    useEffect(() => {
      const getGenericName = async () => {
        const genericName = await findGenericNameById(selectedId);
        setSelected(genericName);
      };

      getGenericName();
    }, [selectedId]);

    useEffect(() => {
      const loadInitial = async () => {
        try {
          const res = await findGenericNamesPaginated(1, 10);
          setInitialGenericNames(res.items);
        } catch (err) {
          console.error("Error loading generic names:", err);
        }
      };

      loadInitial();
    }, []);

    const searchGenericNames = useCallback(
      async (query: string) => {
        try {
          if (!query || query.trim() === "") return initialGenericNames;
          const res = await findGenericNamesPaginated(1, 10, query);
          return res.items;
        } catch (err) {
          console.error("Error searching generic names:", err);
          return [];
        }
      },
      [initialGenericNames]
    );

    const handleCreateGenericName = useCallback(
      async (name: string): Promise<GenericNameDoc> => {
        const newGenericName = await createGenericName({
          name,
          createdBy: "current-user",
        });
        setInitialGenericNames((prev) => [newGenericName, ...prev]);
        return newGenericName;
      },
      []
    );

    const handleEditGenericName = useCallback(
      async (updated: GenericNameDoc): Promise<GenericNameDoc | null> => {
        try {
          const edited = await updateGenericName(updated.id, {
            name: updated.name,
          });

          if (!edited) return null;

          setInitialGenericNames((prev) =>
            prev.map((item) => (item.id === edited.id ? edited : item))
          );

          return edited;
        } catch (error) {
          alert("Error, intenta de nuevo.");
          throw error;
        }
      },
      []
    );

    const handleDeleteGenericName = useCallback(
      async (item: GenericNameDoc) => {
        try {
          await deleteGenericName(item.id);

          setInitialGenericNames((prev) =>
            prev.filter((i) => i.id !== item.id)
          );
        } catch {
          alert("Error, intenta de nuevo.");
        }
      },
      []
    );

    return (
      <div className="space-y-2">
        <CreatableSelect<GenericNameDoc>
          label="Nombre Genérico"
          values={initialGenericNames}
          selectedValue={selected}
          onChange={(value) => {
            setSelected(value);
            onChange(value);
          }}
          searchFunction={searchGenericNames}
          onAddValue={handleCreateGenericName}
          onEditValue={handleEditGenericName}
          onDeleteValue={handleDeleteGenericName}
          displayField="name"
          valueField="id"
          placeholder="Ej: Paracetamol, Amoxicilina, Ibuprofeno"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

GenericNameSelect.displayName = "GenericNameSelect";

export default GenericNameSelect;
