"use client";

import { useEffect } from 'react';
import { useFirebaseAuthInitializer } from '@/hooks/use-firebase-auth';

/**
 * Componente para inicializar a autenticação Firebase
 * Deve ser usado no layout raiz da aplicação
 */
export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  // Inicializa automaticamente a autenticação Firebase
  useFirebaseAuthInitializer();
  
  return <>{children}</>;
}

export default FirebaseAuthProvider;