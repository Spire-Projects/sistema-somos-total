export interface Medication {
  id: string; // unique identifier for the medication
  comercialName: string; // comercial name from the manufacter
  tradeName: string; // e.g., "Aspirin 500mg"
  genericName: string; // e.g., "Acetylsalicylic Acid"
  activeIngredientIds: string[]; // list of ActiveIngredient IDs
  pharmaceuticalFormId: string; // reference to PharmaceuticalFormDoc
  concentration: string; // e.g., "500mg"
  presentation: string; // e.g., "Box of 20 tablets"
  manufacturerId: string; // e.g., "PharmaCorp"
  categoryId: string;            // reference to MedicationCategory
  barcode?: string; // optional barcode for scanning
  batches: MedicationBatch[];  // list of MedicationBatch
  totalStock: number; // total stock available
  description?: string; // e.g., "Used for pain relief"
  indications?: string; // e.g., "Headache, Fever"
  warnings?: string; // e.g., "Do not exceed recommended dose"
  sincronized?: boolean; // indicates if the medication is synchronized with the server
  isDeleted?: boolean; // indicates if the medication is deleted
  createdAt?: string; // e.g., "2023-10-01T12:00:00Z"
  createdBy?: string; // e.g., "user123" - ID of the user who created this medication
  updatedAt?: string; // e.g., "2023-10-01T12:00:00Z" - last update timestamp
  updatedBy?: string; // e.g., "user123" - ID of the user who last updated this medication
}

export interface MedicationBatch {
  batchId: string; // unique identifier for the batch (user-defined)
  expirationDate: string; // e.g., "2025-12-31"
  quantity: number; // e.g., 100
  purchasePrice: number; // precio de compra del lote (costo)
  sellingPrice: number; // precio de venta al público
  purchaseDate?: string; // fecha de compra/adquisición del lote
  supplier?: string; // proveedor de este lote específico
  createdAt?: string; // e.g., "2023-10-01T12:00:00Z"
  createdBy?: string; // e.g., "user123" - ID of the user who created this batch
}  

export interface ActiveIngredient {
  id: string; // unique identifier for the active ingredient
  name: string; // e.g., "Acetylsalicylic Acid"
  aliases?: string[]; // e.g., ["Aspirin", "ASA"]
  createdAt?: string; // e.g., "2023-10-01T12:00:00Z"
  createdBy?: string; // e.g., "user123" - ID of the user who created this ingredient
}

export interface MedicationCategory {
  id: string; // unique identifier for the category
  name: string; // e.g., "Pain Relievers"
  description?: string; // e.g., "Medications used to relieve pain"
  createdAt?: string; // e.g., "2023-10-01T12:00:00Z"
  createdBy?: string; // e.g., "user123" - ID of the user who created this category
}

export interface PharmaceuticalFormDoc {
  id: string; // unique identifier for the pharmaceutical form
  name: string; // e.g., "Tablet", "Syrup"
  aliases?: string[];  // e.g., ["Pill", "Capsule"]
  description?: string; // e.g., "Solid dosage form for oral administration"
  createdAt?: string; // e.g., "2023-10-01T12:00:00Z"
  createdBy?: string; // e.g., "user123" - ID of the user who created this form
  sincronized?: boolean; // indicates if the pharmaceutical form is synchronized with the server
  isDeleted?: boolean; // indicates if the pharmaceutical form is deleted
}

export interface Manufacturer {
  id: string; // unique identifier for the manufacturer
  name: string; // e.g., "PharmaCorp"
  country?: string; // e.g., "USA"
  website?: string; // e.g., "https://www.pharmacorp.com"
  contactEmail?: string; // e.g., "test@test.com"
  createdAt?: string; // e.g., "2023-10-01T12:00:00Z"
  createdBy?: string; // e.g., "user123" - ID of the user who created this manufacturer
  sincronized?: boolean; // indicates if the manufacturer is synchronized with the server
  isDeleted?: boolean; // indicates if the manufacturer is deleted
}

export interface GenericNameDoc { // same than category
  id: string;
  name: string;
  aliases?: string[];
  description?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  sincronized: boolean;
  isDeleted: boolean;
}
