
"use client";

import { create } from 'zustand';
import { User } from '@/lib/auth';
import { tokenUtils } from '@/lib/token-storage';

export type UserType = "client" | "professional" | "partner";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro no login');
      }
      
      // Armazenar tokens de forma segura
      if (data.token) {
        await tokenUtils.storeAuthTokens(data.token, data.refreshToken);
      }
      
      set({ 
        user: data.user, 
        isLoading: false, 
        error: null 
      });
      
      // Redirecionar para o dashboard apropriado
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      }
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      // Limpar tokens seguros
      await tokenUtils.clearAuthTokens();
      
      set({ 
        user: null, 
        isLoading: false, 
        error: null 
      });
      
      // Redirecionar para a página de login
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      }
      
    } catch (error) {
      // Mesmo com erro, limpar o estado local e tokens
      await tokenUtils.clearAuthTokens();
      
      set({ 
        user: null, 
        isLoading: false, 
        error: null 
      });
      
      // Redirecionar para login mesmo com erro
      window.location.href = '/login';
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      // Verificar se há tokens válidos armazenados
      const hasValidTokens = await tokenUtils.hasValidTokens();
      
      if (!hasValidTokens) {
        set({ 
          user: null, 
          isLoading: false, 
          error: null 
        });
        return;
      }
      
      // Obter token para incluir na requisição
      const token = await tokenUtils.getAccessToken();
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ 
          user: data.user, 
          isLoading: false, 
          error: null 
        });
      } else {
        // Token inválido, limpar armazenamento
        await tokenUtils.clearAuthTokens();
        set({ 
          user: null, 
          isLoading: false, 
          error: null 
        });
      }
      
    } catch (error) {
      // Limpar tokens em caso de erro
      await tokenUtils.clearAuthTokens();
      set({ 
        user: null, 
        isLoading: false, 
        error: null 
      });
    }
  },

  clearError: () => set({ error: null })
}));
