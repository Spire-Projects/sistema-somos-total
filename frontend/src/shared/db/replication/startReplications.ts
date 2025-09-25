import type { DatabaseCollections } from "../database";
import { replicateCollection } from "./replicateCollection";

export const startAllReplications = (collections: DatabaseCollections) => {
  console.log("🔄 Iniciando todas las replicaciones...");

  replicateCollection("users", collections.users);
  replicateCollection("generic_names", collections.generic_names);
  replicateCollection("manufacturers", collections.manufacturers);
  replicateCollection("active_ingredients", collections.active_ingredients);
  replicateCollection(
    "medication_categories",
    collections.medication_categories
  );
  replicateCollection("pharmaceutical_forms", collections.pharmaceutical_forms);
  replicateCollection("medications", collections.medications);
  replicateCollection("sales", collections.sales);
  replicateCollection("medication_batches", collections.medication_batches);
  replicateCollection("clients", collections.clients);
  replicateCollection("medics", collections.medics);

  replicateCollection("daily_cash_closures", collections.daily_cash_closures);
  replicateCollection("nits", collections.nits);
  replicateCollection("number_invoice_ranges", collections.number_invoice_ranges);

  console.log("✅ Todas las replicaciones iniciadas");
};
