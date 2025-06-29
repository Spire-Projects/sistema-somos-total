import { useState, memo, useCallback, useEffect } from "react";
import { Button } from "../../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../shared/components/ui/dialog";
import { Plus } from "lucide-react";
import { createMedication } from "../../../../shared/services";
import { useMedicationForm } from "./hooks/useMedicationForm";
import { useCatalogs } from "./hooks/useCatalogs";
import BasicInfoSection from "./components/BasicInfoSection";
import CatalogsSection from "./components/CatalogsSection";
import ActiveIngredientsSection from "./components/ActiveIngredientsSection";
import AdditionalFieldsSection from "./components/AdditionalFieldsSection";

interface AddMedicationDialogProps {
  onMedicationAdded?: () => void;
}

const AddMedicationDialog = ({ onMedicationAdded }: AddMedicationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const form = useMedicationForm();
  const catalogs = useCatalogs();

  // Cargar catálogos solo cuando se abre el diálogo
  useEffect(() => {
    if (open && !catalogs.loading) {
      catalogs.loadCatalogs();
    }
  }, [open, catalogs.loadCatalogs, catalogs.loading]);

  const handleSubmit = useCallback(async (data: any) => {
    setSubmitting(true);
    try {
      const medicationData = form.transformToCreateData(data);
      await createMedication(medicationData);
      form.reset();
      setOpen(false);
      onMedicationAdded?.();
    } catch {
      alert("Hubo un error, intenta de nuevo");
    } finally {
      setSubmitting(false);
    }
  }, [form, onMedicationAdded]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Nuevo Producto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <BasicInfoSection form={form} />
          
          <CatalogsSection 
            form={form}
            categories={catalogs.categories}
            setCategories={catalogs.setCategories}
            genericNames={catalogs.genericNames}
            setGenericNames={catalogs.setGenericNames}
            manufacturers={catalogs.manufacturers}
            setManufacturers={catalogs.setManufacturers}
            pharmaceuticalForms={catalogs.pharmaceuticalForms}
            setPharmaceuticalForms={catalogs.setPharmaceuticalForms}
          />

          <ActiveIngredientsSection 
            form={form}
            activeIngredients={catalogs.activeIngredients}
          />

          <AdditionalFieldsSection form={form} />

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Guardando..." : "Guardar Producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default memo(AddMedicationDialog);
