import React, { memo, useEffect, useState } from "react";
import { Card, CardContent } from "../../../../shared/components/ui/card";
import { Label } from "../../../../shared/components/ui/label";
import { Package } from "lucide-react";
import type { Medication } from "../../../../shared/types/Medication";
import type { BatchFormData } from "../../utils/batchForm.utils";
import type { FieldErrors } from "react-hook-form";
import {
  findAllMedicationsPaginated,
  searchMedications,
} from "@/shared/services";
import CreatableSelect from "@/shared/components/CreatableSelect";

interface BatchMedicationCardProps {
  selectedMedication: Medication | null;
  formData: BatchFormData;
  errors: FieldErrors<BatchFormData>;
  mode: "create" | "edit";
  handleInputChange: (
    field: keyof BatchFormData,
    value: string | number
  ) => void;
}

const BatchMedicationCard: React.FC<BatchMedicationCardProps> = ({
  selectedMedication,
  errors,
  mode,
  handleInputChange,
}) => {
  const [localMedications, setLocalMedications] = useState<Medication[]>([]);

  useEffect(() => {
    const getFirtsMedications = async () => {
      const response = await findAllMedicationsPaginated(1, 10);
      if (response.items) {
        setLocalMedications(response.items);
      }
    };
    getFirtsMedications();
  }, []);

  return (
    <Card className="p-0">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Información del Medicamento
        </h3>

        <div className="space-y-2">
          <Label htmlFor="medicationId">Medicamento *</Label>
          <CreatableSelect<Medication>
            label="Medicamento"
            values={localMedications}
            selectedValue={selectedMedication}
            onChange={(medication) =>
              handleInputChange("medicationId", medication.id)
            }
            searchFunction={searchMedications}
            displayField="tradeName"
            secondaryDisplayField="comercialName"
            valueField="id"
            placeholder="Buscar medicamento..."
            disabled={mode === "edit"} 
            hideLabel
          />
          {errors.medicationId && (
            <p className="text-sm text-red-500">
              {errors.medicationId.message}
            </p>
          )}
          {errors.medicationId && (
            <p className="text-sm text-red-500">
              {errors.medicationId.message}
            </p>
          )}
        </div>

        {selectedMedication && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <p>
                <strong>Concentración:</strong>{" "}
                {selectedMedication.concentration}
              </p>
              <p>
                <strong>Presentación:</strong> {selectedMedication.presentation}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(BatchMedicationCard);
