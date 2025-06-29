import { memo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import type { MedicationFormData } from "../hooks/useMedicationForm";

interface AdditionalFieldsSectionProps {
  form: UseFormReturn<MedicationFormData>;
}

const AdditionalFieldsSection = ({ form }: AdditionalFieldsSectionProps) => {
  const { register, watch, setValue } = form;
  const requiresPrescription = watch("requiresPrescription");

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Presentación
          </label>
          <Input
            placeholder="Ej: Tabletas - Caja x 30"
            {...register("presentation", { required: "Este campo es requerido" })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Concentración
          </label>
          <Input
            placeholder="Ej: 500mg"
            {...register("concentration")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Código de Barras (Opcional)
        </label>
        <Input
          placeholder="Código de barras del producto"
          {...register("barcode")}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Descripción
        </label>
        <Textarea
          placeholder="Descripción del producto"
          {...register("description")}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Indicaciones
          </label>
          <Textarea
            placeholder="Para qué se usa este medicamento"
            {...register("indications")}
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Advertencias
          </label>
          <Textarea
            placeholder="Advertencias y precauciones"
            {...register("warnings")}
            rows={2}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="prescription"
          checked={requiresPrescription}
          onCheckedChange={(checked) => setValue("requiresPrescription", !!checked)}
        />
        <label
          htmlFor="prescription"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Requiere receta médica
        </label>
      </div>
    </>
  );
};

export default memo(AdditionalFieldsSection);
