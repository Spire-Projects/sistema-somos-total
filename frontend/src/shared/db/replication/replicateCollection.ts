import { replicateFirestore } from "rxdb/plugins/replication-firestore";
import type { RxCollection } from "rxdb";
import {
  collection as fbCollection,
  type FirestoreDataConverter,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { firestore } from "@/shared/config/firebase";
import { config } from "@/shared/config/config";
import { syncService } from "../../services/SyncService";

/**
 * Configura la replicación de una colección RxDB con Firestore
 * Implementación optimizada sin bloqueos manuales ni flags temporales
 */
export const replicateCollection = <T extends { [key: string]: any }>(
  name: string,
  collectionRx: RxCollection<T>
) => {
  if (!config.REPLICATION.ENABLED) {
    console.log(`⏸️ Replicación deshabilitada para: ${name}`);
    return null;
  }

  console.log(`🔧 Configurando replicación para: ${name}`);

  const converter: FirestoreDataConverter<T> = {
    toFirestore: (data: T) => {
      const cleanData: any = {};
      
      // Campos internos de RxDB que NO deben ir a Firestore (excepto _deleted)
      const rxdbInternalFields = ['_rev', '_meta', '_attachments'];
      
      Object.keys(data).forEach((key) => {
        const value = data[key];
        
        // ✅ CRÍTICO: Firestore no acepta undefined
        if (value === undefined) {
          // Omitir campos undefined completamente
          return;
        }
        
        // ✅ CRÍTICO: Convertir null a deleteField() para Firestore
        if (value === null) {
          cleanData[key] = deleteField();
          return;
        }
        
        // Incluir el campo si no es un campo interno de RxDB
        if (!rxdbInternalFields.includes(key)) {
          cleanData[key] = value;
        }
      });

      // Asegurar campos requeridos
      if (!cleanData.updatedAt) {
        cleanData.updatedAt = new Date().toISOString();
      }
      
      // _deleted es requerido por Firestore para manejar eliminaciones
      if (cleanData._deleted === undefined) {
        cleanData._deleted = false;
      }

      // ✅ CRÍTICO: Agregar serverTimestamp para sincronización incremental
      // Firestore establece automáticamente el timestamp del servidor
      cleanData.serverTimestamp = serverTimestamp();

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
        console.log(`📥 ${name}: Recibiendo documento remoto ${doc.id}`, {
          originalDoc: doc,
          updatedAt: doc.updatedAt,
          _lastModifiedAt: doc._lastModifiedAt,
          _serverUpdatedAt: doc._serverUpdatedAt,
          serverTimestamp: doc.serverTimestamp
        });

        // Marcar como sincronizado cuando viene de Firestore
        const modifiedDoc = {
          ...doc,
          _lastSyncedAt: new Date().toISOString(),
          sincronized: true, // Marcar como sincronizado cuando viene del remoto
        };
        
        console.log(`📥 ${name}: Documento modificado para RxDB:`, {
          id: modifiedDoc.id,
          sincronized: modifiedDoc.sincronized
        });
        
        return modifiedDoc;
      },
    },
    push: {
      batchSize: config.REPLICATION.BATCH_SIZE,
      modifier: (doc: any) => {
        console.log(`📤 ${name}: Enviando documento ${doc.id}`, {
          localUpdatedAt: doc.updatedAt,
          local_lastModifiedAt: doc._lastModifiedAt,
          hasLocalPriority: doc._forceLocalPriority,
        });

        const now = new Date().toISOString();

        // Crear copia limpia sin metadatos de RxDB
        const cleanDoc = { ...doc };
        delete cleanDoc._lastSyncedAt;
        delete cleanDoc._forceLocalPriority;
        delete cleanDoc._rev;
        delete cleanDoc._meta;
        delete cleanDoc._attachments;

        // ✅ CRÍTICO: Limpiar campos undefined y null (Firestore no acepta undefined)
        Object.keys(cleanDoc).forEach((key) => {
          if (cleanDoc[key] === undefined) {
            delete cleanDoc[key];
          } else if (cleanDoc[key] === null) {
            // Convertir null a deleteField() para que Firestore elimine el campo
            cleanDoc[key] = deleteField();
          }
        });

        // Asegurar timestamps válidos
        const finalDoc = {
          ...cleanDoc,
          updatedAt: cleanDoc.updatedAt || now,
          _lastModifiedAt: cleanDoc._lastModifiedAt || now,
          sincronized: false, // Será marcado como true después del push exitoso
        };

        console.log(`📤 ${name}: Documento limpio para envío:`, {
          id: finalDoc.id,
          finalUpdatedAt: finalDoc.updatedAt,
          final_lastModifiedAt: finalDoc._lastModifiedAt
        });

        return finalDoc;
      },
    },
    live: true,
    // ✅ Campo para sincronización incremental (NO debe estar en schema)
    serverTimestampField: "serverTimestamp",
    waitForLeadership: false,
    retryTime: 5000,
  });

  console.log(`✅ Replicación configurada exitosamente: ${name}`);

  // Manejar errores
  replicationState.error$.subscribe((error) => {
    console.error(`❌ Error en replicación ${name}:`, error);
    syncService.onSynchronizationError(name, error);
  });

  // Actividad de sincronización
  replicationState.active$.subscribe((active) => {
    if (active) {
      console.log(`🔄 Replicación ${name}: ACTIVA`);
      syncService.onSynchronizationStart();
    } else {
      console.log(`⏸️ Replicación ${name}: INACTIVA`);
    }
  });

  // Marcar como sincronizado después de envío exitoso
  replicationState.sent$.subscribe(async (docs) => {
    console.log(`⬆️ ${name}: Enviados ${docs.length} documentos a Firestore`);

    if (docs.length > 0) {
      const docsArray = Array.isArray(docs) ? docs : [docs];
      docsArray.forEach((doc: any) => {
        console.log(`📤 ${name}: Documento enviado exitosamente:`, {
          id: doc.id,
          updatedAt: doc.updatedAt,
          _lastModifiedAt: doc._lastModifiedAt,
        });
      });

      // Marcar documentos como sincronizados después del push exitoso
      try {
        for (const doc of docsArray) {
          const localDoc = await collectionRx.findOne((doc as any).id).exec();
          if (localDoc) {
            await localDoc.patch({
              sincronized: true,
              _lastSyncedAt: new Date().toISOString(),
            } as any);
          }
        }
        console.log(
          `✅ ${name}: ${docsArray.length} documentos marcados como sincronizados`
        );
      } catch (error) {
        console.error(
          `❌ ${name}: Error marcando documentos como sincronizados:`,
          error
        );
      }
    }

    syncService.onSynchronizationActivity(name, "sent", docs.length);
  });

  // Tracking de documentos recibidos
  replicationState.received$.subscribe((docs) => {
    const docsArray = Array.isArray(docs) ? docs : [docs];
    if (docsArray.length > 0) {
      console.log(`📥 ${name}: ${docsArray.length} documentos recibidos de Firestore`);
    }
    syncService.onSynchronizationActivity(name, "received", docsArray.length);
  });

  console.log(`🎯 Replicación ${name} lista para sincronizar`);

  return replicationState;
};
