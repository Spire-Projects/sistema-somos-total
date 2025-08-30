import { firestore } from '@/shared/config/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Migración para agregar timestamps faltantes a documentos existentes en Firestore
 */
export const migrateExistingDocuments = async () => {
  console.log('🔄 Iniciando migración de timestamps...');
  
  const collections = [
    'medications',
    'clients', 
    'users',
    'sales',
    'medication_batches',
    'manufacturers',
    'generic_names',
    'active_ingredients',
    'medication_categories',
    'pharmaceutical_forms'
  ];

  for (const collectionName of collections) {
    try {
      console.log(`📝 Migrando colección: ${collectionName}`);
      
      const colRef = collection(firestore, collectionName);
      const snapshot = await getDocs(colRef);
      
      let migratedCount = 0;
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const needsUpdate = !data._lastModifiedAt || !data.updatedAt;
        
        if (needsUpdate) {
          const docRef = doc(firestore, collectionName, docSnapshot.id);
          const now = new Date().toISOString();
          
          await updateDoc(docRef, {
            _lastModifiedAt: data._lastModifiedAt || now,
            updatedAt: data.updatedAt || now,
            createdAt: data.createdAt || now,
            _serverUpdatedAt: serverTimestamp()
          });
          
          migratedCount++;
        }
      }
      
      console.log(`✅ ${collectionName}: ${migratedCount} documentos migrados`);
      
    } catch (error) {
      console.error(`❌ Error migrando ${collectionName}:`, error);
    }
  }
  
  console.log('✅ Migración de timestamps completada');
};

/**
 * Función para ejecutar desde la consola del navegador
 */
export const runTimestampMigration = () => {
  migrateExistingDocuments().catch(console.error);
};
