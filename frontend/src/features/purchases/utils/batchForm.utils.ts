import * as z from 'zod';
import type {
  BatchWithMedication,
  CreateBatchData,
} from "../../../shared/types/Sales";
import type { Manufacturer } from "../../../shared/types/Medication";

// Esquema de validación con Zod
export const batchFormSchema = z.object({
  medicationId: z.string().min(1, "Selecciona un medicamento"),
  batchId: z.string().min(1, "El ID del lote es requerido").trim(),
  expirationDate: z.string().min(1, "La fecha de vencimiento es requerida"),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  purchasePrice: z.number().min(0.01, "El precio de compra debe ser mayor a 0"),
  sellingPrice: z.number().min(0.01, "El precio de venta debe ser mayor a 0"),
  purchaseDate: z.string(),
  supplier: z.string().optional(),
  manufacturerId: z.string().optional(), // ID del manufacturer seleccionado
  createdBy: z.string(),
}).refine((data) => data.sellingPrice >= data.purchasePrice, {
  message: "El precio de venta no puede ser menor al precio de compra",
  path: ["sellingPrice"],
});

export type BatchFormData = z.infer<typeof batchFormSchema> & {
  selectedManufacturer?: Manufacturer | null; // Objeto manufacturer completo para el UI
};

// Función de validación legacy (mantener por compatibilidad si es necesaria)
export function validateBatchForm(formData: Partial<CreateBatchData>) {
  const newErrors: Record<string, string> = {};

  if (!formData.medicationId) {
    newErrors.medicationId = "Selecciona un medicamento";
  }

  if (!formData.batchId?.trim()) {
    newErrors.batchId = "El ID del lote es requerido";
  }

  if (!formData.expirationDate) {
    newErrors.expirationDate = "La fecha de vencimiento es requerida";
  }

  if (!formData.quantity || formData.quantity <= 0) {
    newErrors.quantity = "La cantidad debe ser mayor a 0";
  }

  if (!formData.purchasePrice || formData.purchasePrice <= 0) {
    newErrors.purchasePrice = "El precio de compra debe ser mayor a 0";
  }

  if (!formData.sellingPrice || formData.sellingPrice <= 0) {
    newErrors.sellingPrice = "El precio de venta debe ser mayor a 0";
  }

  if (
    formData.sellingPrice &&
    formData.purchasePrice &&
    formData.sellingPrice < formData.purchasePrice
  ) {
    newErrors.sellingPrice =
      "El precio de venta no puede ser menor al precio de compra";
  }

  return newErrors;
}

// Calcular precio de venta basado en margen de ganancia
export const calculateSellingPrice = (purchasePrice: number, margin: number) => {
  return purchasePrice * (1 + margin / 100);
};

// Calcular margen basado en precios
export const calculateProfitMargin = (purchasePrice: number, sellingPrice: number) => {
  if (purchasePrice <= 0) return 0;
  return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
};

export const getEmptyBatch = (userId: string): CreateBatchData => ({
  medicationId: "",
  batchId: "",
  expirationDate: "",
  quantity: 0,
  purchasePrice: 0,
  sellingPrice: 0,
  purchaseDate: new Date().toISOString().split("T")[0],
  supplier: "",
  createdBy: userId,
});

export const getFormtByBatch = (
  batch: BatchWithMedication
): CreateBatchData => ({
  medicationId: batch.medication.id,
  batchId: batch.batchId,
  expirationDate: batch.expirationDate,
  quantity: batch.quantity,
  purchasePrice: batch.purchasePrice,
  sellingPrice: batch.sellingPrice,
  purchaseDate: batch.purchaseDate || new Date().toISOString().split("T")[0],
  supplier: batch.supplier || "",
  createdBy: batch.createdBy || "current-user",
});
