/* import type { RxJsonSchema, RxCollection } from "rxdb";
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
          batchId: { type: "string" },
          medicationId: { type: "string" },
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
    },
    createdAt: { type: "number" },
    createdBy: { type: "string", maxLength: 100 },
  },
  required: ["id", "items", "total", "paymentMethod", "createdAt"],
  indexes: ["client", "createdAt"],
};

export type SaleCollection = RxCollection<Sale>;
 */