import type { DatabaseCollections } from "../database";
import { replicateCollection } from "./replicateCollection";

export const startAllReplications = (collections: DatabaseCollections) => {
  replicateCollection("medications", collections.medications);
  replicateCollection("active_ingredients", collections.active_ingredients);
  replicateCollection("manufacturers", collections.manufacturers);
  replicateCollection(
    "medication_categories",
    collections.medication_categories
  );
  replicateCollection("pharmaceutical_forms", collections.pharmaceutical_forms);
  replicateCollection("generic_names", collections.generic_names);
  replicateCollection("users", collections.users);
  replicateCollection("medication_batches", collections.medication_batches);
};
