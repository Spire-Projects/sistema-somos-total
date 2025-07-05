import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Stethoscope, Loader2 } from "lucide-react";
import { createMedic } from "@/shared/services/MedicService";
import type { Medic } from "@/shared/types/Sales";

const medicSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  licenseNumber: z.string().min(3, "La licencia médica debe tener al menos 3 caracteres"),
});

type MedicFormData = z.infer<typeof medicSchema>;

interface MedicFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMedicCreated: (medic: Medic) => void;
}

const MedicFormDialog = memo(({
  isOpen,
  onClose,
  onMedicCreated
}: MedicFormDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MedicFormData>({
    resolver: zodResolver(medicSchema),
    defaultValues: {
      fullName: "",
      licenseNumber: "",
    },
  });

  const onSubmit = async (data: MedicFormData) => {
    setIsLoading(true);
    try {
      const medicData = {
        fullName: data.fullName.trim(),
        licenseNumber: data.licenseNumber.trim(),
        createdBy: "current-user", // TODO: Get from auth context
      };

      const newMedic = await createMedic(medicData);
      onMedicCreated(newMedic);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error creating medic:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Crear Nuevo Médico
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Nombre Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="Nombre completo del médico"
              {...form.register("fullName")}
              disabled={isLoading}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-red-500">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">
              Licencia Médica <span className="text-red-500">*</span>
            </Label>
            <Input
              id="licenseNumber"
              placeholder="Número de licencia médica"
              {...form.register("licenseNumber")}
              disabled={isLoading}
            />
            {form.formState.errors.licenseNumber && (
              <p className="text-sm text-red-500">
                {form.formState.errors.licenseNumber.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Médico
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

MedicFormDialog.displayName = 'MedicFormDialog';

export default MedicFormDialog;
