import { memo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/shared/components/ui/input";
import type { MedicationFormData } from "../hooks/useMedicationForm";

interface BasicInfoSectionProps {
  form: UseFormReturn<MedicationFormData>;
}

const BasicInfoSection = ({ form }: BasicInfoSectionProps) => {
  const { register, formState: { errors } } = form;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Nombre Comercial
        </label>
        <Input
          placeholder="Nombre comercial del producto"
          {...register("tradeName", { required: "Este campo es requerido" })}
        />
        {errors.tradeName && (
          <span className="text-sm text-red-500">{errors.tradeName.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Nombre del Fabricante
        </label>
        <Input
          placeholder="Nombre comercial del fabricante"
          {...register("comercialName", { required: "Este campo es requerido" })}
        />
        {errors.comercialName && (
          <span className="text-sm text-red-500">{errors.comercialName.message}</span>
        )}
      </div>
    </div>
  );
};

export default memo(BasicInfoSection);
