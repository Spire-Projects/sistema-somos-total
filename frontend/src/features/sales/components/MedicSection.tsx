import { memo, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Stethoscope, Plus, Loader2, X } from "lucide-react";
import CreatableSelect from "@/shared/components/CreatableSelect";
import { findMedicsPaginated, createMedic } from "@/shared/services/MedicService";
import type { Medic } from "@/shared/types/Sales";

const medicSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  licenseNumber: z.string().min(1, "El número de licencia es obligatorio"),
});

type MedicFormData = z.infer<typeof medicSchema>;

interface MedicSectionProps {
  selectedMedicId?: string;
  selectedMedicName?: string;
  onMedicSelect: (medic: Medic | null) => void;
}

// Componente memoizado para el formulario inline
const MedicForm = memo(({ onMedicCreated }: { onMedicCreated: (medic: Medic) => void }) => {
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
    } catch (error) {
      console.error("Error creating medic:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="fullName" className="text-xs">
          Nombre Completo <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fullName"
          placeholder="Nombre del médico"
          {...form.register("fullName")}
          disabled={isLoading}
          className="h-8 text-sm"
        />
        {form.formState.errors.fullName && (
          <p className="text-xs text-red-500">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="licenseNumber" className="text-xs">
          Número de Licencia <span className="text-red-500">*</span>
        </Label>
        <Input
          id="licenseNumber"
          placeholder="Número de licencia médica"
          {...form.register("licenseNumber")}
          disabled={isLoading}
          className="h-8 text-sm"
        />
        {form.formState.errors.licenseNumber && (
          <p className="text-xs text-red-500">
            {form.formState.errors.licenseNumber.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-8 text-xs"
        size="sm"
      >
        {isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
        Crear Médico
      </Button>
    </form>
  );
});

MedicForm.displayName = 'MedicForm';

const MedicSection = memo(({
  selectedMedicId,
  selectedMedicName,
  onMedicSelect
}: MedicSectionProps) => {
  const [selectedMedic, setSelectedMedic] = useState<Medic | null>(null);
  const [initialMedics, setInitialMedics] = useState<Medic[]>([]);
  const [showMedicForm, setShowMedicForm] = useState(false);

  // Cargar los primeros 10 médicos al montar el componente
  useEffect(() => {
    const loadInitialMedics = async () => {
      try {
        const response = await findMedicsPaginated(1, 10);
        setInitialMedics(response.items);
      } catch (error) {
        console.error('Error loading initial medics:', error);
      }
    };
    loadInitialMedics();
  }, []);

  // Función de búsqueda para médicos
  const searchMedics = useCallback(async (searchQuery: string) => {
    try {
      const response = await findMedicsPaginated(1, 10, searchQuery);
      return response.items;
    } catch (error) {
      console.error('Error searching medics:', error);
      return [];
    }
  }, []);

  // Manejar selección de médico
  const handleMedicChange = useCallback((medic: Medic) => {
    setSelectedMedic(medic);
    onMedicSelect(medic);
  }, [onMedicSelect]);

  // Limpiar selección de médico
  const handleClearMedic = useCallback(() => {
    setSelectedMedic(null);
    onMedicSelect(null);
  }, [onMedicSelect]);

  // Manejar creación de nuevo médico
  const handleMedicCreated = useCallback((newMedic: Medic) => {
    setSelectedMedic(newMedic);
    setInitialMedics(prev => [newMedic, ...prev]);
    onMedicSelect(newMedic);
    setShowMedicForm(false);
  }, [onMedicSelect]);

  // Toggle del formulario
  const toggleForm = useCallback(() => {
    setShowMedicForm(prev => !prev);
  }, []);

  return (
    <Card className="!gap-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Stethoscope className="h-3 w-3" />
          Médico (opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {selectedMedicId && selectedMedicName ? (
          <div className="space-y-2">
            <div className="p-2 bg-green-50 rounded border">
              <p className="font-medium text-xs">{selectedMedicName}</p>
              <p className="text-xs text-gray-600">Médico seleccionado</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearMedic}
              className="w-full h-7 text-xs"
            >
              Cambiar Médico
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-1 text-gray-500">
              <p className="text-xs">Sin médico asignado</p>
            </div>
            
            <CreatableSelect<Medic>
              label=""
              values={initialMedics}
              selectedValue={selectedMedic}
              onChange={handleMedicChange}
              searchFunction={searchMedics}
              displayField="fullName"
              valueField="id"
              placeholder="Buscar médico..."
              hideLabel={true}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleForm}
              className="w-full h-7 text-xs"
            >
              {showMedicForm ? (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  Nuevo Médico
                </>
              )}
            </Button>

            {showMedicForm && (
              <div className="border-t pt-3">
                <MedicForm onMedicCreated={handleMedicCreated} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MedicSection.displayName = 'MedicSection';

export default MedicSection;
