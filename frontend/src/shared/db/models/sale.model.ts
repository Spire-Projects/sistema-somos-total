import type { RxJsonSchema, RxCollection } from "rxdb";
import type { Sale } from "../../types/Sales";

export const saleSchema: RxJsonSchema<Sale> = {
  version: 4,
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
          quantity: { type: "number", minimum: 1 },
          unitPrice: { type: "number", minimum: 0 },
          listPrice: { type: "number", minimum: 0 },
          discount: { type: "number", minimum: 0 },
          total: { type: "number", minimum: 0 }
        },
        required: ["batchId", "medicationId", "quantity", "unitPrice", "total"]
      }
    },
    total: { type: "number", minimum: 0 },
    totalWithoutDiscount: { type: "number", minimum: 0 },
    totalDiscount: { type: "number", minimum: 0 },
    client: { type: "string", maxLength: 100 },
    paymentMethod: {
      type: "string",
      enum: ["efectivo", "qr"],
      maxLength: 30,
    },
    createdAt: { type: "string", maxLength: 50 },
    createdBy: { type: "string", maxLength: 100 },
    isDeleted: { type: "boolean" },
    sincronized: { type: "boolean" },
    idMedic: { type: "string", maxLength: 100 },
    factured: { type: "boolean" },
    nitClient: { type: "string", maxLength: 100 },
    socialReasonClient: { type: "string", maxLength: 200 },
    saleNotes: { type: "string", maxLength: 1000 },
    numberInvoice: { type: "string", maxLength: 100 , default: "0000000"},
  },
  required: ["id", "items", "total", "paymentMethod", "createdAt", "createdBy", "factured"],
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


export const saleMigrationStrategies = {
  
  1: (oldDoc: any) => {
    let paymentMethod = oldDoc.paymentMethod;
    if (paymentMethod === 'tarjeta') {
      paymentMethod = 'qr';
    }
    return {
      ...oldDoc,
      paymentMethod,
    };
  },
  
  2: (oldDoc: any) => {
    let paymentMethod = oldDoc.paymentMethod;
    if (paymentMethod === 'transferencia') {
      paymentMethod = 'qr';
    }
    return {
      ...oldDoc,
      paymentMethod,
    };
  },

  3: (oldDoc: any) => {
    return {
      ...oldDoc,
      nitClient: oldDoc.nitClient || "",
      socialReasonClient: oldDoc.socialReasonClient || "",
      saleNotes: oldDoc.saleNotes || ""
    };
  },

  4: (oldDoc: any) => {
    return {
      ...oldDoc,
      numberInvoice: "0000000"
    };
  }
};
export type SaleCollection = RxCollection<Sale>;
