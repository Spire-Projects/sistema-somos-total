import type { RxJsonSchema, RxCollection } from "rxdb";
import type { GenericNameDoc } from "../../types/Medication";

export const genericNameSchema: RxJsonSchema<GenericNameDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
      maxLength: 200,
    },
    aliases: {
      type: "array",
      uniqueItems: true,
      items: {
        type: "string",
        maxLength: 100,
      },
    },
    description: {
      type: "string",
      maxLength: 500,
    },
    createdAt: {
      type: "string",
      maxLength: 50,
    },
    createdBy: {
      type: "string",
      maxLength: 100,
    },
    updatedAt: {
      type: "string",
      maxLength: 50,
    },
    updatedBy: {
      type: "string",
      maxLength: 100,
    },
    sincronized: {
      type: "boolean",
    },
    isDeleted: {
      type: "boolean",
    },
  },
  required: [
    "id",
    "name",
    "createdAt",
    "createdBy",
    "sincronized",
    "isDeleted",
  ],
  indexes: ["name", "createdAt", "isDeleted"],
};

export type GenericNameCollection = RxCollection<GenericNameDoc>;
