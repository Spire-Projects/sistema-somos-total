import { memo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";

interface ClientFormData {
  name: string;
  email?: string;
  nit?: string;
  phone?: string;
  address?: string;
  loyaltyPoints?: number;
}

interface ClientFormProps {
  form: UseFormReturn<ClientFormData>;
  mode?: "create" | "edit";
}

// Componente memoizado para evitar re-renders innecesarios
export const ClientForm = memo(({ form, mode = "create" }: ClientFormProps) => {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="grid gap-4">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nombre completo *</Label>
          <Input
            id="name"
            placeholder="Juan Pérez"
            autoComplete="name"
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nit">NIT</Label>
          <Input
            id="nit"
            placeholder="12345678"
            autoComplete="off"
            {...register("nit")}
            className={errors.nit ? "border-red-500" : ""}
          />
          {errors.nit && (
            <p className="text-sm text-red-500">{errors.nit.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="juan@ejemplo.com"
            autoComplete="email"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Información de contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+591 70123456"
            autoComplete="tel"
            {...register("phone")}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="loyaltyPoints">Puntos de fidelidad iniciales</Label>
          <Input
            id="loyaltyPoints"
            type="number"
            min={0}
            placeholder="0"
            {...register("loyaltyPoints", {
              valueAsNumber: true,
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            className={errors.loyaltyPoints ? "border-red-500" : ""}
          />
          {errors.loyaltyPoints && (
            <p className="text-sm text-red-500">{errors.loyaltyPoints.message}</p>
          )}
        </div>
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          placeholder="Av. Ejemplo #123, Zona Centro, La Paz"
          className={`resize-none ${errors.address ? "border-red-500" : ""}`}
          {...register("address")}
        />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>
    </div>
  );
});

ClientForm.displayName = "ClientForm";
