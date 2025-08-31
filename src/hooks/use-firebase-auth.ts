"use client";

import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { FirebaseAuthService, UserProfile, AuthResult } from '@/lib/firebase-auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export type UserType = "client" | "professional" | "partner";

// Interface do usuário para compatibilidade com o sistema existente
export interface User {
  id: string;
  email: string;
  name: string;
  type: UserType;
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FirebaseAuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Métodos de autenticação
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  
  // Métodos utilitários
  checkAuth: () => Promise<void>;
  clearError: () => void;
  initialize: () => void;
}

export const useFirebaseAuth = create<FirebaseAuthState>()((set, get) => ({
  user: null,
  firebaseUser: null,
  userProfile: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    
    // Listener para mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Usuário logado - buscar perfil completo
          const userProfile = await FirebaseAuthService.getCurrentUserProfile();
          
          if (userProfile) {
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userProfile.name,
              type: userProfile.userType,
              avatar: userProfile.avatar,
              phone: userProfile.phone,
              isEmailVerified: firebaseUser.emailVerified,
              createdAt: userProfile.createdAt,
              updatedAt: userProfile.updatedAt
            };
            
            set({
              user,
              firebaseUser,
              userProfile,
              isLoading: false,
              isInitialized: true,
              error: null
            });
          } else {
            // Perfil não encontrado - usuário pode estar incompleto
            set({
              user: null,
              firebaseUser,
              userProfile: null,
              isLoading: false,
              isInitialized: true,
              error: 'Perfil de usuário não encontrado'
            });
          }
        } else {
          // Usuário não logado
          set({
            user: null,
            firebaseUser: null,
            userProfile: null,
            isLoading: false,
            isInitialized: true,
            error: null
          });
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        set({
          user: null,
          firebaseUser: null,
          userProfile: null,
          isLoading: false,
          isInitialized: true,
          error: error instanceof Error ? error.message : 'Erro na autenticação'
        });
      }
    });
    
    // Cleanup será feito automaticamente pelo Firebase
    return unsubscribe;
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await FirebaseAuthService.signIn(email, password);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro no login');
      }
      
      // O estado será atualizado automaticamente pelo listener onAuthStateChanged
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no login';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  register: async (email: string, password: string, name: string, userType: UserType) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await FirebaseAuthService.signUp(email, password, {
        name,
        userType,
        phone: '',
        avatar: ''
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Erro no cadastro');
      }
      
      // O estado será atualizado automaticamente pelo listener onAuthStateChanged
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no cadastro';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      const result = await FirebaseAuthService.signOut();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro no logout');
      }
      
      // O estado será limpo automaticamente pelo listener onAuthStateChanged
      
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, limpar o estado local
      set({ 
        user: null,
        firebaseUser: null,
        userProfile: null,
        isLoading: false, 
        error: null 
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await FirebaseAuthService.resetPassword(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar e-mail de recuperação');
      }
      
      set({ isLoading: false });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar e-mail de recuperação';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await FirebaseAuthService.updateProfile(data);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar perfil');
      }
      
      // Atualizar estado local
      const currentState = get();
      if (currentState.userProfile && currentState.user) {
        const updatedProfile = { ...currentState.userProfile, ...data };
        const updatedUser = {
          ...currentState.user,
          name: updatedProfile.name,
          avatar: updatedProfile.avatar,
          phone: updatedProfile.phone
        };
        
        set({
          userProfile: updatedProfile,
          user: updatedUser,
          isLoading: false
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await FirebaseAuthService.changePassword(currentPassword, newPassword);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao alterar senha');
      }
      
      set({ isLoading: false });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao alterar senha';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  deleteAccount: async (password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await FirebaseAuthService.deleteAccount(password);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir conta');
      }
      
      // O estado será limpo automaticamente pelo listener onAuthStateChanged
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir conta';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  resendEmailVerification: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await FirebaseAuthService.resendEmailVerification();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao reenviar e-mail de verificação');
      }
      
      set({ isLoading: false });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reenviar e-mail de verificação';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  checkAuth: async () => {
    // Com Firebase, o estado é gerenciado automaticamente pelo onAuthStateChanged
    // Este método existe para compatibilidade com a interface existente
    const currentState = get();
    if (!currentState.isInitialized) {
      currentState.initialize();
    }
  },

  clearError: () => set({ error: null })
}));

// Hook para inicializar automaticamente a autenticação
export const useFirebaseAuthInitializer = () => {
  const initialize = useFirebaseAuth(state => state.initialize);
  const isInitialized = useFirebaseAuth(state => state.isInitialized);
  
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);
};

// Hook de compatibilidade que mantém a mesma interface do useAuthStore
export const useAuthStore = useFirebaseAuth;

export default useFirebaseAuth;