import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  sendEmailVerification,
  User,
  UserCredential,
  AuthError
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { auth, db, getFirebaseErrorMessage, FIREBASE_COLLECTIONS } from './firebase';

// Tipos
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  userType: 'client' | 'professional';
  isEmailVerified: boolean;
  createdAt: any;
  updatedAt: any;
  // Campos específicos do cliente
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  // Campos específicos do profissional
  profession?: string;
  skills?: string[];
  experience?: number;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  availability?: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  serviceRadius?: number; // em km
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  userType: 'client' | 'professional';
  phoneNumber?: string;
  profession?: string;
  skills?: string[];
}

// Classe de serviço de autenticação Firebase
export class FirebaseAuthService {
  // Registrar novo usuário
  static async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // Criar usuário no Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;

      // Atualizar perfil do usuário
      await updateProfile(user, {
        displayName: data.displayName
      });

      // Enviar email de verificação
      await sendEmailVerification(user);

      // Criar documento do usuário no Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        userType: data.userType,
        isEmailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(data.userType === 'professional' && {
          profession: data.profession,
          skills: data.skills || [],
          experience: 0,
          rating: 0,
          reviewCount: 0,
          isVerified: false
        })
      };

      await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, user.uid), userProfile);

      return {
        success: true,
        user: userProfile
      };
    } catch (error: any) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  }

  // Login
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Buscar dados do usuário no Firestore
      const userDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('Dados do usuário não encontrados');
      }

      const userData = userDoc.data() as UserProfile;
      
      // Atualizar último login
      await updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, user.uid), {
        lastLoginAt: serverTimestamp(),
        isEmailVerified: user.emailVerified
      });

      return {
        success: true,
        user: {
          ...userData,
          isEmailVerified: user.emailVerified
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  }

  // Logout
  static async signOut(): Promise<AuthResult> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  }

  // Resetar senha
  static async resetPassword(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  }

  // Atualizar perfil
  static async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>
  ): Promise<AuthResult> {
    try {
      const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
      
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Atualizar também no Firebase Auth se necessário
      if (auth.currentUser && (updates.displayName || updates.photoURL)) {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }

      // Buscar dados atualizados
      const updatedDoc = await getDoc(userRef);
      const userData = updatedDoc.data() as UserProfile;

      return {
        success: true,
        user: userData
      };
    } catch (error: any) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  }

  // Alterar senha
  static async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Usuário não autenticado');
      }

      // Reautenticar usuário
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Atualizar senha
      await updatePassword(user, newPassword);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  }

  // Deletar conta
  static async deleteAccount(password: string): Promise<AuthResult> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Usuário não autenticado');
      }

      // Reautenticar usuário
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Deletar documento do Firestore
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.USERS, user.uid));

      // Deletar usuário do Firebase Auth
      await deleteUser(user);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  }

  // Reenviar email de verificação
  static async resendEmailVerification(): Promise<AuthResult> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      await sendEmailVerification(user);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  }

  // Buscar dados do usuário atual
  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, user.uid));
      
      if (!userDoc.exists()) return null;

      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      return null;
    }
  }

  // Verificar se email está disponível
  static async isEmailAvailable(email: string): Promise<boolean> {
    try {
      // Tentar criar um usuário temporário para verificar se o email existe
      await createUserWithEmailAndPassword(auth, email, 'temp-password');
      // Se chegou aqui, o email está disponível, mas precisamos deletar o usuário temporário
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
      return true;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return false;
      }
      // Para outros erros, assumimos que o email está disponível
      return true;
    }
  }
}

// Hook para observar mudanças de autenticação
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

// Utilitários
export const getCurrentUser = () => auth.currentUser;
export const isUserSignedIn = () => !!auth.currentUser;

export default FirebaseAuthService;