import type { RxJsonSchema, RxCollection } from "rxdb";
import type { GenericNameDoc } from "../../types/Medication";

export const genericNameSchema: RxJsonSchema<GenericNameDoc> = {
  version: 1,
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

// Estrategias de migración para GenericName
export const genericNameMigrationStrategies = {
  // Migración de versión 0 a 1: no se requieren cambios adicionales
  // ya que los campos updatedAt y updatedBy ya existen
  1: (oldDoc: any) => {
    return {
      ...oldDoc
    };
  }
};

export type GenericNameCollection = RxCollection<GenericNameDoc>;
