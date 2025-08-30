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
          key !== '_rev' &&
          key !== '_meta'
        ) {
          cleanData[key] = data[key];
        }
      });
      
      // Asegurar que siempre tenga updatedAt
      if (!cleanData.updatedAt) {
        cleanData.updatedAt = new Date().toISOString();
      }
      
      return cleanData;
    },
    fromFirestore: (snap) => {
      const data = snap.data() as T;
      // Asegurar que el documento tenga un ID válido
      if (!data.id) {
        (data as any).id = snap.id;
      }
      return data;
    },
  };

  const colRef = fbCollection(firestore, name).withConverter(converter);

  console.log(`🔄 Iniciando replicación para colección: ${name}`);

  const replicationState = replicateFirestore<T>({
    replicationIdentifier: `sync-${name}`,
    collection: collectionRx,
    firestore: {
      projectId: firestore.app.options.projectId as string,
      database: firestore,
      collection: colRef,
    },
    pull: {
      batchSize: 20,
      modifier: (doc: any) => {
        console.log(`📥 ${name}: Recibiendo documento remoto ${doc.id}`);
        return {
          ...doc,
          _lastSyncedAt: new Date().toISOString()
        };
      }
    },
    push: {
      batchSize: 20,
      modifier: (doc: any) => {
        console.log(`📤 ${name}: Enviando documento ${doc.id}`);
        
        // Solo actualizar timestamp si no tiene uno reciente
        const now = new Date().toISOString();
        const shouldUpdateTimestamp = !doc.updatedAt || 
          (new Date(doc.updatedAt).getTime() < Date.now() - 5000); // Más de 5 segundos
        
        return {
          ...doc,
          updatedAt: shouldUpdateTimestamp ? now : doc.updatedAt,
          _lastModifiedAt: shouldUpdateTimestamp ? now : doc._lastModifiedAt || now
        };
      }
    },
    live: true,
    serverTimestampField: "_serverUpdatedAt",
    waitForLeadership: false
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

  // Manejar conflictos de documentos de forma más directa
  replicationState.received$.subscribe(async (docs) => {
    const docsArray = Array.isArray(docs) ? docs : [docs];
    console.log(`⬇️ ${name}: Recibidos ${docsArray.length} documentos de Firestore`);
    
    if (docsArray.length > 0) {
      docsArray.forEach((doc: any) => {
        console.log(`📥 ${name}: Documento recibido:`, {
          id: doc.id,
          updatedAt: doc.updatedAt,
          _lastModifiedAt: doc._lastModifiedAt
        });
      });
    }
    
    syncService.onSynchronizationActivity(name, 'received', docsArray.length);
  });

  // Log de eventos de envío
  replicationState.sent$.subscribe((docs) => {
    console.log(`⬆️ ${name}: Enviados ${docs.length} documentos a Firestore`);
    
    if (docs.length > 0) {
      docs.forEach((doc: any) => {
        console.log(`📤 ${name}: Documento enviado:`, {
          id: doc.id,
          updatedAt: doc.updatedAt,
          _lastModifiedAt: doc._lastModifiedAt
        });
      });
    }
    
    syncService.onSynchronizationActivity(name, 'sent', docs.length);
  });

  return replicationState;
};
