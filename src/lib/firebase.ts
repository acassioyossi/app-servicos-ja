import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validação das variáveis de ambiente
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('Firebase: Variáveis de ambiente ausentes:', missingEnvVars);
}

// Inicialização do Firebase (evita múltiplas inicializações)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicialização dos serviços
auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// Analytics apenas no cliente
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics não pôde ser inicializado:', error);
  }
}

// Configurações adicionais
auth.useDeviceLanguage(); // Define idioma baseado no dispositivo

// Exportações
export { app, auth, db, storage, analytics };
export default app;

// Tipos úteis
export type {
  User,
  UserCredential,
  AuthError,
  IdTokenResult
} from 'firebase/auth';

export type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
  Query,
  Timestamp,
  FieldValue
} from 'firebase/firestore';

export type {
  StorageReference,
  UploadTask,
  UploadTaskSnapshot,
  FullMetadata
} from 'firebase/storage';

// Utilitários
export const isFirebaseConfigured = () => {
  return missingEnvVars.length === 0;
};

export const getFirebaseErrorMessage = (error: any): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/email-already-in-use': 'Este email já está em uso',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
    'auth/invalid-email': 'Email inválido',
    'auth/user-disabled': 'Esta conta foi desabilitada',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'permission-denied': 'Permissão negada',
    'unavailable': 'Serviço temporariamente indisponível'
  };

  return errorMessages[error.code] || error.message || 'Erro desconhecido';
};

// Constantes úteis
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  MESSAGES: 'messages',
  TRANSACTIONS: 'transactions',
  SERVICES: 'services',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications'
} as const;

export const FIREBASE_STORAGE_PATHS = {
  AVATARS: 'avatars',
  DOCUMENTS: 'documents',
  SERVICE_IMAGES: 'service-images',
  CHAT_ATTACHMENTS: 'chat-attachments'
} as const;