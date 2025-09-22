import { memo, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { User, Plus, Loader2, X } from "lucide-react";
import CreatableSelect from "@/shared/components/CreatableSelect";
import { getAllClientsPaginated, createClient } from "@/shared/services/ClientService";
import type { Client } from "@/shared/types/Client";

const clientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email({ message: "Correo inválido" }).optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientSectionProps {
  selectedClientId?: string;
  selectedClientName?: string;
  onClientSelect: (client: Client | null) => void;
}

// Componente memoizado para el formulario inline
const ClientForm = memo(({ onClientCreated }: { onClientCreated: (client: Client) => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    try {
      const clientData = {
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        createdBy: "current-user", // TODO: Get from auth context
      };

      const newClient = await createClient(clientData);
      onClientCreated(newClient);
      form.reset();
    } catch (error) {
      console.error("Error creating client:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="name" className="text-xs">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Nombre del cliente"
          {...form.register("name")}
          disabled={isLoading}
          className="h-8 text-sm"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-xs">Teléfono (opcional)</Label>
          <Input
            id="phone"
            placeholder="Número de teléfono"
            {...form.register("phone")}
            disabled={isLoading}
            className="h-8 text-sm"
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs">Correo (opcional)</Label>
          <Input
            id="email"
            placeholder="ejemplo@correo.com"
            {...form.register("email")}
            disabled={isLoading}
            className="h-8 text-sm"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-8 text-xs"
        size="sm"
      >
        {isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
        Crear Cliente
      </Button>
    </form>
  );
});

ClientForm.displayName = 'ClientForm';

const ClientSection = memo(({
  selectedClientId,
  selectedClientName,
  onClientSelect
}: ClientSectionProps) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [initialClients, setInitialClients] = useState<Client[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);

  // Cargar los primeros 10 clientes al montar el componente
  useEffect(() => {
    const loadInitialClients = async () => {
      try {
        const response = await getAllClientsPaginated(1, 10);
        setInitialClients(response.items);
      } catch (error) {
        console.error('Error loading initial clients:', error);
      }
    };
    loadInitialClients();
  }, []);

  // Función de búsqueda para clientes
  const searchClients = useCallback(async (searchQuery: string) => {
    try {
      const response = await getAllClientsPaginated(1, 10, searchQuery);
      return response.items;
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  }, []);

  // Manejar selección de cliente
  const handleClientChange = useCallback((client: Client) => {
    setSelectedClient(client);
    onClientSelect(client);
  }, [onClientSelect]);

  // Limpiar selección de cliente
  const handleClearClient = useCallback(() => {
    setSelectedClient(null);
    onClientSelect(null);
  }, [onClientSelect]);

  // Manejar creación de nuevo cliente
  const handleClientCreated = useCallback((newClient: Client) => {
    setSelectedClient(newClient);
    setInitialClients(prev => [newClient, ...prev]);
    onClientSelect(newClient);
    setShowClientForm(false);
  }, [onClientSelect]);

  // Toggle del formulario
  const toggleForm = useCallback(() => {
    setShowClientForm(prev => !prev);
  }, []);

  return (
    <Card className="!gap-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-3 w-3" />
          Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {selectedClientId && selectedClientName ? (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded border">
              <p className="font-medium text-xs">{selectedClientName}</p>
              <p className="text-xs text-gray-600">Cliente seleccionado</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearClient}
              className="w-full h-7 text-xs"
            >
              Cambiar Cliente
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-1 text-gray-500">
              <p className="text-xs">Cliente general</p>
            </div>
            
            <CreatableSelect<Client>
              label=""
              values={initialClients}
              selectedValue={selectedClient}
              onChange={handleClientChange}
              searchFunction={searchClients}
              displayField="name"
              valueField="id"
              placeholder="Buscar cliente..."
              hideLabel={true}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleForm}
              className="w-full h-7 text-xs"
            >
              {showClientForm ? (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  Nuevo Cliente
                </>
              )}
            </Button>

            {showClientForm && (
              <div className="border-t pt-3">
                <ClientForm onClientCreated={handleClientCreated} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ClientSection.displayName = 'ClientSection';

export default ClientSection;
