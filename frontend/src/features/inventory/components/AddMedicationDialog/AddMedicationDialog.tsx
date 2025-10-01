import { useState, memo, useCallback, useMemo, useEffect } from "react";
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
import {
  createMedication,
  findMedicationById,
  updateMedication,
} from "../../../../shared/services";
import type { CreateMedicationData } from "../../../../shared/types/MedicationCrud";
import { toast } from "sonner";
import MedicationCatalogSelects from "./MedicationCatalogSelects.tsx";
import ActiveIngredientsMultiSelect from "./ActiveIngredientsMultiSelect.tsx";
import BarcodeScannerInput from "./BarCodeScanner.tsx";
import GenericNameSelect from "./GenericNameSelect.tsx";
import { Switch } from "@/shared/components/ui/switch.tsx";
import { useSelector } from "react-redux";
import CustomDialog from "../../../../shared/components/CustomDialog";

interface AddMedicationDialogProps {
  onMedicationAdded?: () => void;
  medicationId?: string;
  edit?: boolean;
}

interface MedicationFormData
  extends Omit<CreateMedicationData, "activeIngredientIds"> {
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
  prescriptionRequired: false,
};

// Mover patrones regex fuera del componente para evitar recreaciones
const CONCENTRATION_PATTERN =
  /^[\d.,]+\s*(mg|g|ml|l|UI|mcg|µg|%|mEq|mmol)\s*$/i;
const BARCODE_PATTERN = /^[0-9]+$/;

const AddMedicationDialog = memo(
  ({ onMedicationAdded, medicationId, edit }: AddMedicationDialogProps) => {
    const [open, setOpen] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const {
      register,
      handleSubmit,
      setValue,
      watch,
      reset,
      formState: { errors, isSubmitting, isDirty },
    } = useForm<MedicationFormData>({
      defaultValues,
      mode: "onSubmit", // Cambiar a onSubmit para validación menos intrusiva
      reValidateMode: "onBlur", // Solo re-validar en onBlur después del primer submit
    });
    const authUser = useSelector((state: any) => state.auth.user);

    // Watch campos específicos de forma más eficiente
    const comercialName = watch("comercialName");
    const tradeName = watch("tradeName");
    const categoryId = watch("categoryId");
    const genericName = watch("genericName");
    const manufacturerId = watch("manufacturerId");
    const pharmaceuticalFormId = watch("pharmaceuticalFormId");
    const presentation = watch("presentation");
    const concentration = watch("concentration");
    const activeIngredientIds = watch("activeIngredientIds");
    const barcode = watch("barcode");
    const prescriptionRequired = watch("prescriptionRequired");

    useEffect(() => {
      const getData = async () => {
        // Solo cargar datos cuando el diálogo esté abierto y hay medicationId
        if (medicationId && open) {
          try {
            const medicationData = await findMedicationById(medicationId);

            if (!medicationData) return;

            // Usar batch update más eficiente
            Object.entries(medicationData).forEach(([key, value]) => {
              if (key in defaultValues) {
                setValue(
                  key as keyof MedicationFormData,
                  value,
                  { shouldDirty: false, shouldValidate: false } // Evitar validación excesiva
                );
              }
            });

            // Para el modo editar, activar validación después de cargar los datos
            // para que el usuario vea inmediatamente si hay algún problema
            if (edit) {
              setShowValidationErrors(true);
            }
          } catch (error) {
            console.error("Error loading medication data:", error);
            toast.error("Error al cargar los datos del medicamento");
          }
        }
      };

      getData();
    }, [medicationId, setValue, open, edit]); // Incluir 'edit' como dependencia

    // Custom validation rules
    const validationRules = useMemo(
      () => ({
        comercialName: {
          required: "El nombre de marca es requerido",
          minLength: { value: 2, message: "Mínimo 2 caracteres" },
          maxLength: { value: 100, message: "Máximo 100 caracteres" },
        },
        tradeName: {
          required: "El nombre comercial completo es requerido",
          minLength: { value: 2, message: "Mínimo 2 caracteres" },
          maxLength: { value: 100, message: "Máximo 100 caracteres" },
        },
        genericName: {
          required: "El principio activo es requerido",
          minLength: { value: 2, message: "Mínimo 2 caracteres" },
          maxLength: { value: 100, message: "Máximo 100 caracteres" },
        },
        presentation: {
          required: "La presentación es requerida",
          minLength: { value: 2, message: "Mínimo 2 caracteres" },
        },
        concentration: {
          required: "La concentración es requerida",
          pattern: {
            value: CONCENTRATION_PATTERN,
            message: "Formato inválido. Ej: 500mg, 10ml, 25%",
          },
        },
        barcode: {
          pattern: {
            value: BARCODE_PATTERN,
            message: "Código de barras debe tener sólo números",
          },
        },
      }),
      []
    );

    const onSubmit = useCallback(
      async (data: MedicationFormData) => {
        try {
          // Activar visualización de errores en el primer intento de submit
          setShowValidationErrors(true);

          // Validation: At least one active ingredient is required
          if (
            !data.activeIngredientIds ||
            data.activeIngredientIds.length === 0
          ) {
            toast.error("Debe seleccionar al menos un principio activo");
            return;
          }

          const medicationData: CreateMedicationData = {
            ...data,
            createdBy: authUser?.id || "current-user",
          };
          if (medicationId) {
            await updateMedication(medicationId, medicationData);
            toast.success("Medicamento actualizado exitosamente");
          } else {
            // Create new medication
            await createMedication(medicationData);
            toast.success("Medicamento creado exitosamente");
          }

          // Reset form y cerrar dialog
          reset();
          setOpen(false);
          setShowValidationErrors(false); // Reset validation errors state

          // Notificar al componente padre
          onMedicationAdded?.();
        } catch (error) {
          console.error("Error creating medication:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Error al crear el medicamento"
          );
        }
      },
      [reset, onMedicationAdded, medicationId] // Agregar medicationId como dependencia
    );

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        if (!newOpen && isDirty) {
          setShowConfirmClose(true);
          return;
        }

        if (!newOpen) {
          reset();
          setShowValidationErrors(false); // Reset validation errors when closing
        } else {
          // Reset validation errors when opening
          setShowValidationErrors(false);
        }

        setOpen(newOpen);
      },
      [isDirty, reset]
    );

    const handleConfirmClose = useCallback(() => {
      setShowConfirmClose(false);
      reset();
      setShowValidationErrors(false);
      setOpen(false);
    }, [reset]);

    const handleCancelClose = useCallback(() => {
      setShowConfirmClose(false);
    }, []);

    const handleFieldChange = useCallback(
      (field: keyof MedicationFormData, value: any) => {
        if (field === "prescriptionRequired") {
          console.log(
            "handleFieldChange called for prescriptionRequired with value:",
            value
          );
        }
        setValue(field, value, {
          shouldDirty: true,
          shouldValidate: false, // Reducir validación automática para mejor rendimiento
        });

        // Activar validación después de la primera interacción con cualquier campo
        if (!showValidationErrors) {
          setShowValidationErrors(true);
        }
      },
      [setValue, showValidationErrors]
    );

    // Validation for required fields - Optimizado para evitar re-renders excesivos
    const isFormValid = useMemo(() => {
      return (
        comercialName?.trim() &&
        tradeName?.trim() &&
        categoryId &&
        genericName?.trim() &&
        manufacturerId &&
        pharmaceuticalFormId &&
        presentation?.trim() &&
        concentration?.trim() &&
        activeIngredientIds?.length > 0
      );
    }, [
      comercialName,
      tradeName,
      categoryId,
      genericName,
      manufacturerId,
      pharmaceuticalFormId,
      presentation,
      concentration,
      activeIngredientIds,
    ]);

    // Errores condicionales para componentes hijos
    const conditionalErrors = useMemo(() => {
      return showValidationErrors ? errors : {};
    }, [showValidationErrors, errors]);

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            className="w-full sm:w-auto"
            variant={edit ? "outline" : "default"}
            data-medication-dialog-trigger
          >
            {!edit && <Plus className="h-4 w-4 mr-2" />}
            {edit ? "Editar" : "Nuevo Producto"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {edit ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comercialName">Nombre Comercial*</Label>
                <Input
                  id="comercialName"
                  {...register("comercialName", validationRules.comercialName)}
                  placeholder="Ej: Tylenol, Advil, Omeprazol MK"
                  onBlur={() => setShowValidationErrors(true)}
                />
                {showValidationErrors && errors.comercialName && (
                  <p className="text-sm text-red-600">
                    {errors.comercialName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeName">Nombre Comercial Completo *</Label>
                <Input
                  id="tradeName"
                  {...register("tradeName", validationRules.tradeName)}
                  placeholder="Ej: Tylenol Extra Fuerte 500mg, Advil 200mg Cápsulas"
                  onBlur={() => setShowValidationErrors(true)}
                />
                {showValidationErrors && errors.tradeName && (
                  <p className="text-sm text-red-600">
                    {errors.tradeName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Principio Activo (Nombre Genérico) */}
            <GenericNameSelect
              selectedId={genericName}
              onChange={(generic) =>
                handleFieldChange("genericName", generic.id)
              }
              error={
                showValidationErrors ? errors.genericName?.message : undefined
              }
            />

            {/* Selects de Catálogos */}
            <MedicationCatalogSelects
              categoryId={categoryId}
              manufacturerId={manufacturerId}
              pharmaceuticalFormId={pharmaceuticalFormId}
              onFieldChange={handleFieldChange}
              errors={conditionalErrors}
            />

            {/* Información Adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="presentation">
                  Presentación del Producto *
                </Label>
                <Input
                  id="presentation"
                  {...register("presentation", validationRules.presentation)}
                  placeholder="Ej: Caja x 30 tabletas, Frasco x 100ml, Blíster x 20 cápsulas"
                  onBlur={() => setShowValidationErrors(true)}
                />
                {showValidationErrors && errors.presentation && (
                  <p className="text-sm text-red-600">
                    {errors.presentation.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="concentration">Concentración por Dosis *</Label>
                <Input
                  id="concentration"
                  {...register("concentration", validationRules.concentration)}
                  placeholder="Ej: 500mg, 10ml, 25%, 5mg/ml, 200UI"
                  onBlur={() => setShowValidationErrors(true)}
                />
                {showValidationErrors && errors.concentration && (
                  <p className="text-sm text-red-600">
                    {errors.concentration.message}
                  </p>
                )}
              </div>
            </div>

            <BarcodeScannerInput
              value={barcode || ""}
              onChange={(val) => handleFieldChange("barcode", val)}
              error={showValidationErrors ? errors.barcode?.message : undefined}
            />

            {/* Información Descriptiva */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Producto</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Ej: Analgésico y antipirético de acción rápida. Alivia dolor de cabeza, muscular y fiebre..."
                  rows={3}
                  className="placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="indications">Indicaciones Médicas</Label>
                  <Textarea
                    id="indications"
                    {...register("indications")}
                    placeholder="Ej: Dolor de cabeza, fiebre, dolor muscular, artritis, dolor dental..."
                    className="placeholder:text-gray-400"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warnings">Advertencias y Precauciones</Label>
                  <Textarea
                    id="warnings"
                    {...register("warnings")}
                    placeholder="Ej: No exceder la dosis recomendada. Consultar médico si persisten síntomas..."
                    rows={4}
                    className="placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Principios Activos */}
            <ActiveIngredientsMultiSelect
              onChange={(ids: string[]) =>
                handleFieldChange("activeIngredientIds", ids)
              }
              error={
                showValidationErrors
                  ? errors.activeIngredientIds?.message
                  : undefined
              }
              selected={activeIngredientIds}
            />

            {/* Switch para Receta Médica */}
            <div className="flex items-center space-x-4">
              <Switch
                id="prescriptionRequired"
                checked={prescriptionRequired}
                onCheckedChange={(checked: boolean) =>
                  handleFieldChange("prescriptionRequired", checked)
                }
              />
              <Label htmlFor="prescriptionRequired" className="font-medium">
                Requiere Receta Médica
              </Label>
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

        <CustomDialog
          isOpen={showConfirmClose}
          onConfirm={handleConfirmClose}
          onCancel={handleCancelClose}
          title="¿Cerrar sin guardar?"
          description="¿Estás seguro de que quieres cerrar? Se perderán los cambios no guardados."
          textConfirm="Sí, cerrar"
          textCancel="Cancelar"
        />
      </Dialog>
    );
  }
);

AddMedicationDialog.displayName = "AddMedicationDialog";

export default AddMedicationDialog;
