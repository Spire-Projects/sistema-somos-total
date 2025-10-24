import React, { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import { Button } from "../../../../shared/components/ui/button";
import { Package, Plus } from "lucide-react";
import type { Medication, Manufacturer } from "../../../../shared/types/Medication";
import type { BatchWithMedication } from "../../../../shared/types/modelTypes/Sale";
import { useSelector } from "react-redux";
import AddMedicationDialog from "../../../inventory/components/AddMedicationDialog/AddMedicationDialog";
import {
  calculateProfitMargin,
  calculateSellingPrice,
  getEmptyBatch,
  getFormtByBatch,
  batchFormSchema,
  type BatchFormData,
} from "../../utils/batchForm.utils";

// Componentes divididos
import BatchMedicationCard from "./BatchMedicationCard";
import BatchInfoCard from "./BatchInfoCard";
import BatchPriceCard from "./BatchPriceCard";
import BatchDialogFooter from "./BatchDialogFooter";
import { createMedicationBatch, updateMedicationBatch } from "@/shared/services/MedicationBatchService";
import { findMedicationById } from "@/shared/services/MedicationService";
import { searchManufacturers } from "@/shared/services/ManufacturerService";

interface BatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batch?: BatchWithMedication | null;
  mode: "create" | "edit";
  preselectedMedicationId?: string | null;
}

const BatchDialog: React.FC<BatchDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batch,
  mode,
  preselectedMedicationId = null,
}) => {
  const authUser = useSelector((state: any) => state.auth.user);
  const [profitMargin, setProfitMargin] = useState(0);
  const [isProfitMode, setIsProfitMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAddMedicationDialog, setShowAddMedicationDialog] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);

  // Configurar react-hook-form
  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: getEmptyBatch(authUser?.id || "current-user"),
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = form;
  const purchasePrice = useWatch({ control, name: "purchasePrice" });
  const sellingPrice = useWatch({ control, name: "sellingPrice" });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && batch) {
        const formData = getFormtByBatch(batch);
        reset(formData);
        setProfitMargin(
          calculateProfitMargin(batch.purchasePrice, batch.sellingPrice)
        );
        
        // Buscar el manufacturer por nombre si existe supplier
        if (batch.supplier) {
          searchManufacturers(batch.supplier).then((manufacturers) => {
            const matchingManufacturer = manufacturers.find(
              (m) => m.name.toLowerCase() === batch.supplier?.toLowerCase()
            );
            setSelectedManufacturer(matchingManufacturer || null);
          }).catch((error) => {
            console.error("Error searching for manufacturer:", error);
            setSelectedManufacturer(null);
          });
        } else {
          setSelectedManufacturer(null);
        }
      } else {
        reset(getEmptyBatch(authUser?.id || "current-user"));
        setProfitMargin(0);
        setSelectedManufacturer(null);
      }
    }
  }, [isOpen, mode, batch, authUser, reset]);

  // Efecto para preseleccionar medicamento
  useEffect(() => {
    if (isOpen && mode === "create" && preselectedMedicationId) {
      setValue("medicationId", preselectedMedicationId);
    }
  }, [isOpen, mode, preselectedMedicationId, setValue]);

  useEffect(() => {
    if (isProfitMode && purchasePrice && profitMargin >= 0) {
      const newSellingPrice = calculateSellingPrice(
        purchasePrice,
        profitMargin
      );
      setValue("sellingPrice", Math.round(newSellingPrice * 100) / 100);
    }
  }, [purchasePrice, profitMargin, isProfitMode, setValue]);

  useEffect(() => {
    if (!isProfitMode && purchasePrice && sellingPrice) {
      setProfitMargin(calculateProfitMargin(purchasePrice, sellingPrice));
    }
  }, [purchasePrice, sellingPrice, isProfitMode]);

  const handleInputChange = useCallback(
    (field: keyof BatchFormData, value: string | number) => {
      setValue(field, value);
    },
    [setValue]
  );

  const handleProfitMarginChange = useCallback((value: number) => {
    setProfitMargin(value);
  }, []);

  const handleMedicationAdded = useCallback(() => {
    setShowAddMedicationDialog(false);
    // Aquí podrías recargar la lista de medicamentos si fuera necesario
  }, []);

  const handleManufacturerChange = useCallback((manufacturer: Manufacturer | null) => {
    setSelectedManufacturer(manufacturer);
  }, []);

  // Efecto para activar el dialog de medicamentos
  useEffect(() => {
    if (showAddMedicationDialog) {
      // Simular click en el trigger del AddMedicationDialog
      const timer = setTimeout(() => {
        const triggerButton = document.querySelector('[data-medication-dialog-trigger]') as HTMLButtonElement;
        if (triggerButton) {
          triggerButton.click();
        }
        setShowAddMedicationDialog(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showAddMedicationDialog]);

  const onSubmit = async (data: BatchFormData) => {
    setLoading(true);
    try {
    
      
      if (mode === 'create') {
        await createMedicationBatch({
          medicationId: data.medicationId,
          batchId: data.batchId,
          expirationDate: data.expirationDate,
          quantity: data.quantity,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          purchaseDate: data.purchaseDate,
          supplier: data.supplier,
          createdBy: authUser?.id || "current-user",
        });
      } else if (mode === 'edit' && batch) {
        await updateMedicationBatch(batch.id, {
          batchId: data.batchId,
          expirationDate: data.expirationDate,
          quantity: data.quantity,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          purchaseDate: data.purchaseDate,
          supplier: data.supplier,
          updatedBy: authUser?.id || "current-user",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving batch:", error);
    } finally {
      setLoading(false);
    }
  };

  const formValues = watch();
  const extendedFormValues = {
    ...formValues,
    selectedManufacturer,
  };
  const [selectedMedication, setSelectedMedication] =
    useState<Medication | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (formValues.medicationId) {
      findMedicationById(formValues.medicationId).then((med) => {
        if (isMounted) setSelectedMedication(med);
      });
    } else {
      setSelectedMedication(null);
    }
    return () => {
      isMounted = false;
    };
  }, [formValues.medicationId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          min-w-[90vw] 
          sm:min-w-[500px] 
          md:min-w-[600px] 
          lg:min-w-[700px] 
          xl:min-w-[800px] 
          max-h-[90vh] 
          overflow-y-auto
        "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
        <Package className="h-5 w-5" />
        {mode === "create" ? "Agregar Nuevo Lote" : "Editar Lote"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Utilizar los componentes memoizados */}
          <BatchMedicationCard
        selectedMedication={selectedMedication}
        formData={formValues}
        errors={errors}
        mode={mode}
        handleInputChange={handleInputChange}
          />

          <Button 
        type="button" 
        variant="outline" 
        className="w-full mb-4"
        onClick={() => setShowAddMedicationDialog(true)}
          >
        <Plus className="h-5 w-5 mr-2" />
        Agregar Medicamento
          </Button>

          <BatchInfoCard
            formData={extendedFormValues}
            errors={errors}
            mode={mode}
            handleInputChange={handleInputChange}
            onManufacturerChange={handleManufacturerChange}
          />

          <BatchPriceCard
        formData={formValues}
        errors={errors}
        isProfitMode={isProfitMode}
        profitMargin={profitMargin}
        setIsProfitMode={setIsProfitMode}
        handleInputChange={handleInputChange}
        handleProfitMarginChange={handleProfitMarginChange}
          />

          <BatchDialogFooter mode={mode} loading={loading} onClose={onClose} />
        </form>
      </DialogContent>

      {/* Componente AddMedicationDialog oculto para activar su diálogo */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
        <AddMedicationDialog onMedicationAdded={handleMedicationAdded} />
      </div>
    </Dialog>
  );
};

export default BatchDialog;
