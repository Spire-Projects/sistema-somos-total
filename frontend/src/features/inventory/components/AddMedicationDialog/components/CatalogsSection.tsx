import { memo, type Dispatch, type SetStateAction } from "react";
import type { UseFormReturn } from "react-hook-form";
import type {
  MedicationCategory,
  PharmaceuticalFormDoc,
  Manufacturer,
  GenericNameDoc,
} from "@/shared/types/Medication";
import { AsyncCreatableSelect } from "@/shared/components/AsyncCreatableSelect";
import type { MedicationFormData } from "../hooks/useMedicationForm";
import {
  createMedicationCategory,
  updateMedicationCategory,
  deleteMedicationCategory,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
  createPharmaceuticalForm,
  updatePharmaceuticalForm,
  deletePharmaceuticalForm,
} from "@/shared/services";
import {
  createGenericName,
  deleteGenericName,
  updateGenericName,
} from "@/shared/services/GenericNameService";

interface CatalogsSectionProps {
  form: UseFormReturn<MedicationFormData>;
  categories: MedicationCategory[];
  setCategories: Dispatch<SetStateAction<MedicationCategory[]>>;
  genericNames: GenericNameDoc[];
  setGenericNames: Dispatch<SetStateAction<GenericNameDoc[]>>;
  manufacturers: Manufacturer[];
  setManufacturers: Dispatch<SetStateAction<Manufacturer[]>>;
  pharmaceuticalForms: PharmaceuticalFormDoc[];
  setPharmaceuticalForms: Dispatch<SetStateAction<PharmaceuticalFormDoc[]>>;
}

const CatalogsSection = ({
  form,
  categories,
  setCategories,
  genericNames,
  setGenericNames,
  manufacturers,
  setManufacturers,
  pharmaceuticalForms,
  setPharmaceuticalForms,
}: CatalogsSectionProps) => {
  const { watch, setValue } = form;
  const watchedValues = watch(["categoryId", "genericName", "manufacturerId", "pharmaceuticalFormId"]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <AsyncCreatableSelect<MedicationCategory>
            label="Categoría"
            value={watchedValues[0]}
            options={categories}
            setOptions={setCategories}
            onChange={(value) => setValue("categoryId", value)}
            onCreate={async (name) =>
              await createMedicationCategory({ name, createdBy: "admin" })
            }
            onEdit={async (id, name) =>
              await updateMedicationCategory(id, {
                name,
                updatedBy: "admin",
              })
            }
            onDelete={async (id) => {
              await deleteMedicationCategory(id);
            }}
          />
        </div>
        <div className="space-y-2">
          <AsyncCreatableSelect<GenericNameDoc>
            label="Nombre Genérico"
            value={watchedValues[1]}
            options={genericNames}
            setOptions={setGenericNames}
            onChange={(value) => setValue("genericName", value)}
            onCreate={async (name) =>
              await createGenericName({ name, createdBy: "admin" })
            }
            onEdit={async (id, name) =>
              await updateGenericName(id, {
                name,
                updatedBy: "admin",
              })
            }
            onDelete={async (id) => {
              await deleteGenericName(id);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <AsyncCreatableSelect
            label="Proveedor"
            value={watchedValues[2]}
            options={manufacturers}
            setOptions={setManufacturers}
            onChange={(value) => setValue("manufacturerId", value)}
            onCreate={async (name) =>
              await createManufacturer({ name, createdBy: "admin" })
            }
            onEdit={async (id, name) =>
              await updateManufacturer(id, {
                name,
                updatedBy: "admin",
              })
            }
            onDelete={async (id) => {
              await deleteManufacturer(id);
            }}
          />
        </div>
        <div className="space-y-2">
          <AsyncCreatableSelect
            label="Forma Farmacéutica"
            value={watchedValues[3]}
            options={pharmaceuticalForms}
            setOptions={setPharmaceuticalForms}
            onChange={(value) => setValue("pharmaceuticalFormId", value)}
            onCreate={async (name) =>
              await createPharmaceuticalForm({ name, createdBy: "admin" })
            }
            onEdit={async (id, name) =>
              await updatePharmaceuticalForm(id, {
                name,
                updatedBy: "admin",
              })
            }
            onDelete={async (id) => {
              await deletePharmaceuticalForm(id);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default memo(CatalogsSection);
