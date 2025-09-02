import { replicateFirestore } from "rxdb/plugins/replication-firestore";
import type { RxCollection } from "rxdb";
import {
  collection as fbCollection,
  type FirestoreDataConverter,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { firestore } from "@/shared/config/firebase";
import { config } from "@/shared/config/config";
import { syncService } from "../../services/SyncService";
import { Subject } from "rxjs";

export const replicateCollection = <T extends { [key: string]: any }>(
  name: string,
  collectionRx: RxCollection<T>
) => {
  // Verificar si la replicación está habilitada
  if (!config.REPLICATION.ENABLED) {
    console.log(`⏸️ ${name}: Replicación deshabilitada por configuración`);
    return null;
  }

  console.log(`🔄 Iniciando replicación para colección: ${name}`, {
    batchSize: config.REPLICATION.BATCH_SIZE,
    realTime: config.REPLICATION.REAL_TIME
  });

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
          key !== '_meta' &&
          key !== '_lastSyncedAt' &&
          key !== '_forceLocalPriority'
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

  // Crear stream de eventos en tiempo real para pull
  const pullStream$ = new Subject<any>();
  
  // Configurar listener de Firestore para cambios en tiempo real
  let unsubscribeSnapshot: (() => void) | null = null;
  
  const startRealtimeListener = () => {
    if (!config.REPLICATION.REAL_TIME) {
      console.log(`⏸️ ${name}: Listener en tiempo real deshabilitado por configuración`);
      return;
    }
    
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
    
    console.log(`🎧 ${name}: Iniciando listener en tiempo real`);
    
    try {
      // Escuchar cambios en la colección de Firestore
      const q = query(colRef, orderBy('updatedAt', 'desc'), limit(100));
      
      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const changes = snapshot.docChanges();
        
        if (changes.length > 0) {
          console.log(`🔄 ${name}: Detectados ${changes.length} cambios remotos`);
          
          const changedDocs = changes.map(change => {
            const docData = change.doc.data();
            console.log(`📡 ${name}: Cambio ${change.type} en documento ${docData.id}`);
            return docData;
          });
          
          // Pequeño delay antes de triggear reSync para evitar spam
          setTimeout(() => {
            console.log(`🔄 ${name}: Triggering reSync debido a cambios remotos`);
            replicationState.reSync();
          }, 500);
        }
      }, (error) => {
        console.error(`❌ ${name}: Error en listener de Firestore:`, error);
        // Reconectar después de un tiempo
        setTimeout(startRealtimeListener, config.REPLICATION.RETRY_INTERVAL);
      });
    } catch (error) {
      console.error(`❌ ${name}: Error configurando listener:`, error);
    }
  };

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
          updatedAt: doc.updatedAt,
          _lastModifiedAt: doc._lastModifiedAt,
          _serverUpdatedAt: doc._serverUpdatedAt
        });
        
        // Marcar como sincronizado cuando viene de Firestore
        return {
          ...doc,
          _lastSyncedAt: new Date().toISOString(),
          sincronized: true  // Marcar como sincronizado cuando viene del remoto
        };
      }
    },
    push: {
      batchSize: config.REPLICATION.BATCH_SIZE,
      modifier: (doc: any) => {
        console.log(`📤 ${name}: Enviando documento ${doc.id}`, {
          localUpdatedAt: doc.updatedAt,
          hasLocalPriority: doc._forceLocalPriority
        });
        
        const now = new Date().toISOString();
        
        // Crear copia limpia sin metadatos de RxDB
        const cleanDoc = { ...doc };
        delete cleanDoc._lastSyncedAt;
        delete cleanDoc._forceLocalPriority;
        delete cleanDoc._deleted; // RxDB internal
        delete cleanDoc._rev; // RxDB internal
        delete cleanDoc._meta; // RxDB internal
        
        // Asegurar timestamps válidos
        const finalDoc = {
          ...cleanDoc,
          updatedAt: cleanDoc.updatedAt || now,
          _lastModifiedAt: cleanDoc._lastModifiedAt || now,
          sincronized: false // Será marcado como true cuando se confirme el push
        };
        
        console.log(`📤 ${name}: Documento limpio para envío:`, {
          id: finalDoc.id,
          finalUpdatedAt: finalDoc.updatedAt
        });
        
        return finalDoc;
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
      // Iniciar listener en tiempo real cuando la replicación esté activa
      startRealtimeListener();
    } else {
      // Limpiar listener cuando esté pausada
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
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

  // Log de eventos de envío y marcar como sincronizado
  replicationState.sent$.subscribe(async (docs) => {
    console.log(`⬆️ ${name}: Enviados ${docs.length} documentos a Firestore`);
    
    if (docs.length > 0) {
      const docsArray = Array.isArray(docs) ? docs : [docs];
      docsArray.forEach((doc: any) => {
        console.log(`📤 ${name}: Documento enviado exitosamente:`, {
          id: doc.id,
          updatedAt: doc.updatedAt,
          _lastModifiedAt: doc._lastModifiedAt
        });
      });
      
      // Marcar documentos como sincronizados después del push exitoso
      try {
        for (const doc of docsArray) {
          const localDoc = await collectionRx.findOne((doc as any).id).exec();
          if (localDoc) {
            await localDoc.patch({
              sincronized: true,
              _lastSyncedAt: new Date().toISOString()
            } as any);
          }
        }
        console.log(`✅ ${name}: ${docsArray.length} documentos marcados como sincronizados`);
      } catch (error) {
        console.error(`❌ ${name}: Error marcando documentos como sincronizados:`, error);
      }
    }
    
    syncService.onSynchronizationActivity(name, 'sent', Array.isArray(docs) ? docs.length : 1);
  });

  // Cleanup listener cuando se cancele la replicación
  replicationState.canceled$.subscribe((canceled) => {
    if (canceled && unsubscribeSnapshot) {
      console.log(`🛑 ${name}: Limpiando listener de Firestore`);
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  });

  return replicationState;
};
