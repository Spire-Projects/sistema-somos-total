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
    closingAmountBs: {
      type: "object",
      properties: {
        amountQr: { type: "number" },
        amountCash: { type: "number" }
      },
      required: ["amountQr", "amountCash"]
    },
    closingAmountArg: {
      type: "object",
      properties: {
        amountQr: { type: "number" },
        amountCash: { type: "number" }
      },
      required: ["amountQr", "amountCash"]
    },
    notes: { type: "string" },
    createdAt: { type: "string" },
    createdBy: { type: "string" },
    updatedAt: { type: "string" },
    updatedBy: { type: "string" },
    sincronized: { type: "boolean" },
    isDeleted: { type: "boolean" },
    deletedBy: { type: "string" },
  },
  required: ["id", "userId", "date", "openingAmount", "closingAmountBs", "closingAmountArg"],
};
