import type { DatabaseCollections } from "../database";
import { replicateCollection } from "./replicateCollection";

export const startAllReplications = (collections: DatabaseCollections) => {
  console.log("🔄 Iniciando todas las replicaciones...");
  
  // Replicaciones en orden de dependencias (colecciones base primero)
  replicateCollection("generic_names", collections.generic_names);
  replicateCollection("manufacturers", collections.manufacturers);
  replicateCollection("active_ingredients", collections.active_ingredients);
  replicateCollection(
    "medication_categories",
    collections.medication_categories
  );
  replicateCollection("pharmaceutical_forms", collections.pharmaceutical_forms);
  replicateCollection("medications", collections.medications);
 
  replicateCollection("users", collections.users);
  replicateCollection("medication_batches", collections.medication_batches);
  replicateCollection("clients", collections.clients);
  
  console.log("✅ Todas las replicaciones iniciadas");
};
