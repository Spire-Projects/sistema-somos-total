import { replicateFirestore } from "rxdb/plugins/replication-firestore";
import type { RxCollection } from "rxdb";
import {
  collection as fbCollection,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { firestore } from "@/shared/config/firebase";

export const replicateCollection = <T extends { [key: string]: any }>(
  name: string,
  collectionRx: RxCollection<T>
) => {
  const converter: FirestoreDataConverter<T> = {
    toFirestore: (data: T) => data,
    fromFirestore: (snap) => snap.data() as T,
  };

  const colRef = fbCollection(firestore, name).withConverter(converter);

  return replicateFirestore<T>({
    replicationIdentifier: `sync-${name}`,
    collection: collectionRx,
    firestore: {
      projectId: "farmacia-la-bonita",
      database: firestore,
      collection: colRef,
    },
    pull: {
      batchSize: 10,
      // Opcional:
      // filter: { fieldPath: 'updatedAt', opStr: '>', value: '...' }
    },
    push: {
      batchSize: 10,
      // Opcional:
      // filter: async (doc) => true
    },
    live: true,
    serverTimestampField: "_serverUpdatedAt",
  });
};
