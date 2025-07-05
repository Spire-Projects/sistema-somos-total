import type { RxJsonSchema, RxCollection } from "rxdb";
import type { Sale } from "../../types/Sales";

export const saleSchema: RxJsonSchema<Sale> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          batchId: { type: "string", maxLength: 100 },
          medicationId: { type: "string", maxLength: 100 },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          total: { type: "number" },
        },
        required: ["batchId", "medicationId", "quantity", "unitPrice", "total"],
      },
    },
    total: { type: "number", minimum: 0 },
    client: { type: "string", maxLength: 200 },
    paymentMethod: {
      type: "string",
      enum: ["efectivo", "tarjeta", "transferencia"],
      maxLength: 30,
    },
    createdAt: { type: "string", maxLength: 50 },
    createdBy: { type: "string", maxLength: 100 },
    isDeleted: { type: "boolean" },
    sincronized: { type: "boolean" },
    idMedic: { type: "string", maxLength: 100 },
    factured: { type: "boolean" },
  },
  required: ["id", "items", "total", "paymentMethod", "createdAt", "createdBy", "factured", "isDeleted", "sincronized"],
  indexes: [
    "client", 
    "createdAt", 
    "createdBy", 
    "paymentMethod",
    "factured",
    "idMedic",
    ["createdAt", "client"],
    ["createdAt", "paymentMethod"],
    ["createdAt", "factured"],
    ["factured", "client"]
  ],
};

export type SaleCollection = RxCollection<Sale>;
