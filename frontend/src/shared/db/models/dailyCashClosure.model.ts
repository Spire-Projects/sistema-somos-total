import type { DailyCashClosure } from "@/shared/types/DailyCashClosure";
import type { RxJsonSchema } from "rxdb";

export const dailyCashClosureSchema: RxJsonSchema<DailyCashClosure> = {
  title: "daily_cash_closures",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    userId: { type: "string" },
    date: { type: "string", format: "date-time" },
    openingAmount: { type: "number" },
    closingAmount: { type: "number" },
    notes: { type: "string" },
    createdAt: { type: "string" },
    createdBy: { type: "string" },
    updatedAt: { type: "string" },
    updatedBy: { type: "string" },
    sincronized: { type: "string" },
    isDeleted: { type: "boolean" },
    deletedBy: { type: "boolean" },
  },
  required: ["id", "userId", "date", "openingAmount", "closingAmount"],
};
