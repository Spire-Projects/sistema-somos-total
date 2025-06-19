import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { config } from '../config/config';
import type { UserDocument } from './models/user.model';

let firebaseApp: FirebaseApp | null = null;
let firestore: Firestore | null = null;

// Inicializar Firebase
function initFirebase(): Firestore {
  if (!firestore) {
    firebaseApp = initializeApp(config.FIREBASE);
    firestore = getFirestore(firebaseApp);
    console.log('Firebase/Firestore inicializado correctamente');
  }
  return firestore;
}

// Funciones específicas para usuarios usando Firestore
export const firestoreUserDB = {
  // Crear un usuario
  async create(userData: Omit<UserDocument, 'id'>): Promise<UserDocument> {
    const db = initFirebase();
    const usersCollection = collection(db, 'users');
    
    const docRef = await addDoc(usersCollection, userData);
    const user = { id: docRef.id, ...userData };
    
    return user;
  },

  // Buscar usuario por email
  async findByEmail(email: string): Promise<UserDocument | null> {
    const db = initFirebase();
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    } as UserDocument;
  },

  // Buscar usuario por ID
  async findById(id: string): Promise<UserDocument | null> {
    const db = initFirebase();
    const userDoc = doc(db, 'users', id);
    const docSnap = await getDoc(userDoc);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as UserDocument;
  },

  // Obtener todos los usuarios
  async findAll(): Promise<UserDocument[]> {
    const db = initFirebase();
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserDocument[];
  },

  // Actualizar un usuario
  async update(id: string, updateData: Partial<UserDocument>): Promise<UserDocument | null> {
    const db = initFirebase();
    const userDocRef = doc(db, 'users', id);
    
    try {
      await updateDoc(userDocRef, updateData);
      
      // Obtener el documento actualizado
      const updatedDoc = await getDoc(userDocRef);
      if (!updatedDoc.exists()) {
        return null;
      }
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as UserDocument;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      return null;
    }
  },

  // Eliminar un usuario
  async delete(id: string): Promise<boolean> {
    const db = initFirebase();
    const userDocRef = doc(db, 'users', id);
    
    try {
      await deleteDoc(userDocRef);
      return true;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      return false;
    }
  },

  // Buscar usuarios por rol
  async findByRole(role: string): Promise<UserDocument[]> {
    const db = initFirebase();
    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection,
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserDocument[];
  },

  // Buscar usuarios activos
  async findActive(): Promise<UserDocument[]> {
    const db = initFirebase();
    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection,
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserDocument[];
  },

  // Sincronizar datos desde RxDB a Firestore (para backup)
  async syncFromLocal(users: UserDocument[]): Promise<void> {
    const db = initFirebase();
    const usersCollection = collection(db, 'users');
    
    console.log(`Sincronizando ${users.length} usuarios a Firestore...`);
    
    for (const user of users) {
      try {
        // Verificar si el usuario ya existe
        const existing = await this.findById(user.id);
        
        if (existing) {
          // Actualizar si existe
          await this.update(user.id, user);
        } else {
          // Crear si no existe
          const { id, ...userData } = user;
          await addDoc(usersCollection, userData);
        }
      } catch (error) {
        console.error(`Error sincronizando usuario ${user.id}:`, error);
      }
    }
    
    console.log('Sincronización completada');
  }
};
