import type { RxJsonSchema, RxCollection } from "rxdb";
import type { Currency } from "@/shared/types/modelTypes/Currency";

export const currencySchema: RxJsonSchema<Currency> = {
  title: "currency",
  description: "Schema for currency collection",
  version: 0,
  type: "object",
  primaryKey: "id",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    simbol: {
      type: "string",
      maxLength: 10,
    },
    equivalenceToBs: {
      type: "number",
    },
    createdBy: {
      type: "string",
      maxLength: 100,
    },
    updatedBy: {
      type: "string",
      maxLength: 100,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    sincronized: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "string",
      format: "date-time",
      maxLength: 100,
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      maxLength: 100,
    },
  },
  required: [
    "id",
    "simbol",
    "equivalenceToBs",
    "createdBy",
    "isDeleted",
    "sincronized",
    "createdAt",
    "updatedAt",
  ],
  indexes: ["simbol"],
};

export type CurrencyCollection = RxCollection<Currency>;
