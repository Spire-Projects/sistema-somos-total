import { useForm } from "react-hook-form";
import type { CreateMedicationData } from "@/shared/types/MedicationCrud";

export interface MedicationFormData {
  comercialName: string;
  tradeName: string;
  genericName: string;
  categoryId: string;
  pharmaceuticalFormId: string;
  concentration: string;
  presentation: string;
  manufacturerId: string;
  barcode: string;
  description: string;
  indications: string;
  warnings: string;
  activeIngredientIds: string[];
  requiresPrescription: boolean;
}

const defaultValues: MedicationFormData = {
  comercialName: "",
  tradeName: "",
  genericName: "",
  categoryId: "",
  pharmaceuticalFormId: "",
  concentration: "",
  presentation: "",
  manufacturerId: "",
  barcode: "",
  description: "",
  indications: "",
  warnings: "",
  activeIngredientIds: [],
  requiresPrescription: false,
};

export const useMedicationForm = () => {
  const form = useForm<MedicationFormData>({
    defaultValues,
    mode: "onChange",
  });

  const transformToCreateData = (data: MedicationFormData): CreateMedicationData => ({
    comercialName: data.comercialName,
    tradeName: data.tradeName,
    genericName: data.genericName,
    activeIngredientIds: data.activeIngredientIds,
    pharmaceuticalFormId: data.pharmaceuticalFormId,
    concentration: data.concentration,
    presentation: data.presentation,
    manufacturerId: data.manufacturerId,
    categoryId: data.categoryId,
    barcode: data.barcode,
    description: data.description,
    indications: data.indications,
    warnings: data.warnings,
    createdBy: "current-user",
  });

  return {
    ...form,
    transformToCreateData,
  };
};
