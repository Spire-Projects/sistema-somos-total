import { replicateFirestore } from "rxdb/plugins/replication-firestore";
import type { RxCollection } from "rxdb";
import {
  collection as fbCollection,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { firestore } from "@/shared/config/firebase";
import { config } from "@/shared/config/config";
import { syncService } from "../../services/SyncService";
import { createConflictHandler } from "./conflictHandler.clean";

/**
 * Configura la replicación de una colección RxDB con Firestore
 * Implementación optimizada sin bloqueos manuales ni flags temporales
 */
export const replicateCollection = <T extends { [key: string]: any }>(
  name: string,
  collectionRx: RxCollection<T>
) => {
  if (!config.REPLICATION.ENABLED) {
    return null;
  }

  // Converter para transformar datos entre RxDB y Firestore
  const converter: FirestoreDataConverter<T> = {
    toFirestore: (data: T) => {
      const cleanData: any = {};
      
      // Campos internos de RxDB que NO deben ir a Firestore
      const rxdbInternalFields = ['_deleted', '_rev', '_meta', '_attachments'];
      
      Object.keys(data).forEach((key) => {
        if (
          data[key] !== null &&
          data[key] !== undefined &&
          !rxdbInternalFields.includes(key)
        ) {
          cleanData[key] = data[key];
        }
      });

      // Asegurar updatedAt
      if (!cleanData.updatedAt) {
        cleanData.updatedAt = new Date().toISOString();
      }

      return cleanData;
    },
    fromFirestore: (snap) => {
      const data = snap.data() as T;
      if (!data.id) {
        (data as any).id = snap.id;
      }
      return data;
    },
  };

  const colRef = fbCollection(firestore, name).withConverter(converter);

  const replicationState = replicateFirestore<T>({
    replicationIdentifier: `sync-${name}`,
    collection: collectionRx,
    firestore: {
      projectId: firestore.app.options.projectId as string,
      database: firestore,
      collection: colRef,
    },
    pull: {
      batchSize: config.REPLICATION.BATCH_SIZE,
      modifier: (doc: any) => {
        // Marcar documentos remotos como sincronizados
        return {
          ...doc,
          sincronized: true,
        };
      },
    },
    push: {
      batchSize: config.REPLICATION.BATCH_SIZE,
      modifier: (doc: any) => {
        // Limpiar campos internos antes de enviar
        const cleanDoc = { ...doc };
        delete cleanDoc._deleted;
        delete cleanDoc._rev;
        delete cleanDoc._meta;
        delete cleanDoc._attachments;

        // Asegurar timestamp
        const now = new Date().toISOString();
        return {
          ...cleanDoc,
          updatedAt: cleanDoc.updatedAt || now,
        };
      },
    },
    live: true, // Sincronización en tiempo real
    serverTimestampField: "updatedAt", // Campo de timestamp del servidor
    waitForLeadership: false,
    retryTime: 5000,
  });

  // Manejar errores
  replicationState.error$.subscribe((error) => {
    console.error(`❌ Replicación ${name}:`, error);
    syncService.onSynchronizationError(name, error);
  });

  // Actividad de sincronización
  replicationState.active$.subscribe((active) => {
    if (active) {
      syncService.onSynchronizationStart();
    }
  });

  // Marcar como sincronizado después de envío exitoso
  replicationState.sent$.subscribe(async (docs) => {
    if (docs.length > 0) {
      try {
        const docsArray = Array.isArray(docs) ? docs : [docs];
        for (const doc of docsArray) {
          const localDoc = await collectionRx.findOne((doc as any).id).exec();
          if (localDoc) {
            await localDoc.patch({
              sincronized: true,
            } as any);
          }
        }
      } catch (error) {
        console.error(`Error marcando ${name} como sincronizado:`, error);
      }
    }

    syncService.onSynchronizationActivity(name, "sent", docs.length);
  });

  // Tracking de documentos recibidos
  replicationState.received$.subscribe((docs) => {
    const docsArray = Array.isArray(docs) ? docs : [docs];
    syncService.onSynchronizationActivity(name, "received", docsArray.length);
  });

  return replicationState;
};
