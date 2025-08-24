import { replicateFirestore } from "rxdb/plugins/replication-firestore";
import type { RxCollection } from "rxdb";
import {
  collection as fbCollection,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { firestore } from "@/shared/config/firebase";
import { syncService } from "../../services/SyncService";

export const replicateCollection = <T extends { [key: string]: any }>(
  name: string,
  collectionRx: RxCollection<T>
) => {
  const converter: FirestoreDataConverter<T> = {
    toFirestore: (data: T) => {
      // Crear copia limpia del documento
      const cleanData: any = {};
      
      // Copiar solo los campos que no son null, undefined o internos de RxDB
      Object.keys(data).forEach(key => {
        if (
          data[key] !== null && 
          data[key] !== undefined && 
          key !== '_deleted' && 
          key !== '_rev'
        ) {
          cleanData[key] = data[key];
        }
      });
      
      return cleanData;
    },
    fromFirestore: (snap) => snap.data() as T,
  };

  const colRef = fbCollection(firestore, name).withConverter(converter);

  console.log(`🔄 Iniciando replicación para colección: ${name}`);

  const replicationState = replicateFirestore<T>({
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
    },
    live: true,
    serverTimestampField: "_serverUpdatedAt",
  });

  // Manejar errores de replicación
  replicationState.error$.subscribe((error) => {
    console.error(`❌ Error en replicación de ${name}:`, error);
    syncService.onSynchronizationError(name, error);
  });

  // Detectar cuando la replicación está activa
  replicationState.active$.subscribe((active) => {
    console.log(`🔄 ${name}: Replicación ${active ? 'activa' : 'pausada'}`);
    if (active) {
      syncService.onSynchronizationStart(name);
    }
  });

  // Log de eventos de recepción
  replicationState.received$.subscribe((docs) => {
    console.log(`⬇️ ${name}: Recibidos ${docs.length} documentos`);
    // Siempre notificar, incluso si docs.length === 0 (significa que verificó y está al día)
    syncService.onSynchronizationActivity(name, 'received', docs.length);
  });

  // Log de eventos de envío
  replicationState.sent$.subscribe((docs) => {
    console.log(`⬆️ ${name}: Enviados ${docs.length} documentos`);
    // Siempre notificar, incluso si docs.length === 0 (significa que verificó y está al día)
    syncService.onSynchronizationActivity(name, 'sent', docs.length);
  });

  return replicationState;
};
