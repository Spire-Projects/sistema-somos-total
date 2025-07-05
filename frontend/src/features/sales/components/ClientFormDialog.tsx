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
import { UserPlus, Loader2 } from "lucide-react";
import { createClient } from "@/shared/services/ClientService";
import type { Client } from "@/shared/types/Client";

const clientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  nit: z.string().optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

const ClientFormDialog = memo(({
  isOpen,
  onClose,
  onClientCreated
}: ClientFormDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      nit: "",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    try {
      const clientData = {
        name: data.name.trim(),
        nit: data.nit?.trim() || undefined,
        createdBy: "current-user", // TODO: Get from auth context
      };

      const newClient = await createClient(clientData);
      onClientCreated(newClient);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error creating client:", error);
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
            <UserPlus className="h-4 w-4" />
            Crear Nuevo Cliente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Nombre completo del cliente"
              {...form.register("name")}
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nit">NIT (opcional)</Label>
            <Input
              id="nit"
              placeholder="Número de identificación tributaria"
              {...form.register("nit")}
              disabled={isLoading}
            />
            {form.formState.errors.nit && (
              <p className="text-sm text-red-500">
                {form.formState.errors.nit.message}
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
              Crear Cliente
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

ClientFormDialog.displayName = 'ClientFormDialog';

export default ClientFormDialog;
