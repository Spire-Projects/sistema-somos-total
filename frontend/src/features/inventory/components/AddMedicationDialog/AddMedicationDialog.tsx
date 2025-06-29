import { useState, memo, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../shared/components/ui/dialog";
import { Input } from "../../../../shared/components/ui/input";
import { Textarea } from "../../../../shared/components/ui/textarea";
import { Label } from "../../../../shared/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { createMedication } from "../../../../shared/services";
import type { CreateMedicationData } from "../../../../shared/types/MedicationCrud";
import { toast } from "sonner";
import MedicationCatalogSelects from "./MedicationCatalogSelects.tsx";
import ActiveIngredientsMultiSelect from "./ActiveIngredientsMultiSelect.tsx";

interface AddMedicationDialogProps {
  onMedicationAdded?: () => void;
}

interface MedicationFormData extends Omit<CreateMedicationData, 'activeIngredientIds'> {
  activeIngredientIds: string[];
}

const defaultValues: Partial<MedicationFormData> = {
  comercialName: "",
  tradeName: "",
  genericName: "",
  activeIngredientIds: [],
  pharmaceuticalFormId: "",
  concentration: "",
  presentation: "",
  manufacturerId: "",
  categoryId: "",
  barcode: "",
  description: "",
  indications: "",
  warnings: "",
};

const AddMedicationDialog = memo(({ onMedicationAdded }: AddMedicationDialogProps) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<MedicationFormData>({
    defaultValues,
    mode: "onChange"
  });

  const watchedValues = watch();

  // Custom validation rules
  const validationRules = useMemo(() => ({
    comercialName: {
      required: "El nombre comercial es requerido",
      minLength: { value: 2, message: "Mínimo 2 caracteres" },
      maxLength: { value: 100, message: "Máximo 100 caracteres" }
    },
    tradeName: {
      required: "El nombre del fabricante es requerido",
      minLength: { value: 2, message: "Mínimo 2 caracteres" },
      maxLength: { value: 100, message: "Máximo 100 caracteres" }
    },
    presentation: {
      required: "La presentación es requerida",
      minLength: { value: 2, message: "Mínimo 2 caracteres" }
    },
    concentration: {
      required: "La concentración es requerida",
      pattern: {
        value: /^[\d.,]+\s*(mg|g|ml|l|UI|mcg|µg|%|mEq|mmol)\s*$/i,
        message: "Formato inválido. Ej: 500mg, 10ml, 25%"
      }
    },
    barcode: {
      pattern: {
        value: /^[0-9]{8,14}$/,
        message: "Código de barras debe tener entre 8 y 14 dígitos"
      }
    }
  }), []);

  const onSubmit = useCallback(async (data: MedicationFormData) => {
    try {
      // Validation: At least one active ingredient is required
      if (!data.activeIngredientIds || data.activeIngredientIds.length === 0) {
        toast.error("Debe seleccionar al menos un principio activo");
        return;
      }

      const medicationData: CreateMedicationData = {
        ...data,
        createdBy: "current-user" // TODO: Obtener del contexto de auth
      };

      await createMedication(medicationData);
      
      toast.success("Medicamento creado exitosamente");
      
      // Reset form y cerrar dialog
      reset();
      setOpen(false);
      
      // Notificar al componente padre
      onMedicationAdded?.();
      
    } catch (error) {
      console.error("Error creating medication:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear el medicamento");
    }
  }, [reset, onMedicationAdded]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && isDirty) {
      const confirmClose = window.confirm("¿Estás seguro de que quieres cerrar? Se perderán los cambios no guardados.");
      if (!confirmClose) return;
    }
    
    if (!newOpen) {
      reset();
    }
    
    setOpen(newOpen);
  }, [isDirty, reset]);

  const handleFieldChange = useCallback((field: keyof MedicationFormData, value: any) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  // Validation for required fields
  const isFormValid = useMemo(() => {
    return (
      watchedValues.comercialName?.trim() &&
      watchedValues.tradeName?.trim() &&
      watchedValues.categoryId &&
      watchedValues.genericName?.trim() &&
      watchedValues.manufacturerId &&
      watchedValues.pharmaceuticalFormId &&
      watchedValues.presentation?.trim() &&
      watchedValues.concentration?.trim() &&
      watchedValues.activeIngredientIds?.length > 0
    );
  }, [watchedValues]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comercialName">Nombre Comercial *</Label>
              <Input
                id="comercialName"
                {...register("comercialName", validationRules.comercialName)}
                placeholder="Nombre comercial del fabricante"
              />
              {errors.comercialName && (
                <p className="text-sm text-red-600">{errors.comercialName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeName">Nombre del Fabricante *</Label>
              <Input
                id="tradeName"
                {...register("tradeName", validationRules.tradeName)}
                placeholder="Nombre comercial del fabricante"
              />
              {errors.tradeName && (
                <p className="text-sm text-red-600">{errors.tradeName.message}</p>
              )}
            </div>
          </div>

          {/* Selects de Catálogos */}
          <MedicationCatalogSelects
            categoryId={watchedValues.categoryId}
            genericName={watchedValues.genericName}
            manufacturerId={watchedValues.manufacturerId}
            pharmaceuticalFormId={watchedValues.pharmaceuticalFormId}
            onFieldChange={handleFieldChange}
            errors={errors}
          />

          {/* Principios Activos */}
          <ActiveIngredientsMultiSelect
            selectedIds={watchedValues.activeIngredientIds}
            onChange={(ids: string[]) => handleFieldChange('activeIngredientIds', ids)}
            error={errors.activeIngredientIds?.message}
          />

          {/* Información Adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="presentation">Presentación *</Label>
              <Input
                id="presentation"
                {...register("presentation", validationRules.presentation)}
                placeholder="Ej: Tabletas - Caja x 30"
              />
              {errors.presentation && (
                <p className="text-sm text-red-600">{errors.presentation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="concentration">Concentración *</Label>
              <Input
                id="concentration"
                {...register("concentration", validationRules.concentration)}
                placeholder="Ej: 500mg"
              />
              {errors.concentration && (
                <p className="text-sm text-red-600">{errors.concentration.message}</p>
              )}
            </div>
          </div>

          {/* Código de Barras */}
          <div className="space-y-2">
            <Label htmlFor="barcode">Código de Barras (Opcional)</Label>
            <Input
              id="barcode"
              {...register("barcode", validationRules.barcode)}
              placeholder="Código de barras del producto"
            />
          </div>

          {/* Información Descriptiva */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Descripción del producto"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="indications">Indicaciones</Label>
                <Textarea
                  id="indications"
                  {...register("indications")}
                  placeholder="Para qué se usa este medicamento"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warnings">Advertencias</Label>
                <Textarea
                  id="warnings"
                  {...register("warnings")}
                  placeholder="Advertencias y precauciones"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty || !isFormValid}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Producto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

AddMedicationDialog.displayName = "AddMedicationDialog";

export default AddMedicationDialog;
