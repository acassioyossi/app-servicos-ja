"use client";

import { useState, useEffect, useCallback } from 'react';
import { FirebaseFirestoreService, Message, Chat } from '@/lib/firebase-firestore';
import { useFirebaseAuth } from './use-firebase-auth';
import { useToast } from './use-toast';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'audio';
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: { [userId: string]: string };
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FirebaseChatState {
  messages: ChatMessage[];
  chats: ChatRoom[];
  currentChatId: string | null;
  isLoading: boolean;
  isLoadingMessages: boolean;
  isLoadingChats: boolean;
  error: string | null;
}

export const useFirebaseChat = () => {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<FirebaseChatState>({
    messages: [],
    chats: [],
    currentChatId: null,
    isLoading: false,
    isLoadingMessages: false,
    isLoadingChats: false,
    error: null
  });

  // Converter Message do Firebase para ChatMessage
  const convertFirebaseMessage = useCallback((msg: Message): ChatMessage => {
    return {
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.senderName,
      timestamp: new Date(msg.timestamp),
      type: msg.type as 'text' | 'image' | 'file' | 'audio',
      attachmentUrl: msg.attachmentUrl,
      attachmentName: msg.attachmentName,
      isRead: msg.isRead
    };
  }, []);

  // Converter Chat do Firebase para ChatRoom
  const convertFirebaseChat = useCallback((chat: Chat): ChatRoom => {
    return {
      id: chat.id,
      participants: chat.participants,
      participantNames: chat.participantNames,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime) : undefined,
      unreadCount: chat.unreadCount || 0,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt)
    };
  }, []);

  // Buscar chats do usuário
  const loadUserChats = useCallback(async () => {
    if (!user?.id) return;
    
    setState(prev => ({ ...prev, isLoadingChats: true, error: null }));
    
    try {
      const chats = await FirebaseFirestoreService.getUserChats(user.id);
      const convertedChats = chats.map(convertFirebaseChat);
      
      setState(prev => ({
        ...prev,
        chats: convertedChats,
        isLoadingChats: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar chats';
      setState(prev => ({
        ...prev,
        isLoadingChats: false,
        error: errorMessage
      }));
      
      toast({
        title: 'Erro ao carregar chats',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [user?.id, convertFirebaseChat, toast]);

  // Escutar chats em tempo real
  const listenToUserChats = useCallback(() => {
    if (!user?.id) return;
    
    setState(prev => ({ ...prev, isLoadingChats: true }));
    
    const unsubscribe = FirebaseFirestoreService.listenToUserChats(
      user.id,
      (chats) => {
        const convertedChats = chats.map(convertFirebaseChat);
        setState(prev => ({
          ...prev,
          chats: convertedChats,
          isLoadingChats: false,
          error: null
        }));
      },
      (error) => {
        const errorMessage = error.message || 'Erro ao escutar chats';
        setState(prev => ({
          ...prev,
          isLoadingChats: false,
          error: errorMessage
        }));
        
        toast({
          title: 'Erro na conexão',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    );
    
    return unsubscribe;
  }, [user?.id, convertFirebaseChat, toast]);

  // Carregar mensagens de um chat
  const loadChatMessages = useCallback(async (chatId: string, limit = 50) => {
    setState(prev => ({ ...prev, isLoadingMessages: true, error: null }));
    
    try {
      const messages = await FirebaseFirestoreService.getChatMessages(chatId, limit);
      const convertedMessages = messages.map(convertFirebaseMessage);
      
      setState(prev => ({
        ...prev,
        messages: convertedMessages,
        currentChatId: chatId,
        isLoadingMessages: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar mensagens';
      setState(prev => ({
        ...prev,
        isLoadingMessages: false,
        error: errorMessage
      }));
      
      toast({
        title: 'Erro ao carregar mensagens',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [convertFirebaseMessage, toast]);

  // Escutar mensagens em tempo real
  const listenToChatMessages = useCallback((chatId: string, limit = 50) => {
    setState(prev => ({ ...prev, isLoadingMessages: true, currentChatId: chatId }));
    
    const unsubscribe = FirebaseFirestoreService.listenToChatMessages(
      chatId,
      (messages) => {
        const convertedMessages = messages.map(convertFirebaseMessage);
        setState(prev => ({
          ...prev,
          messages: convertedMessages,
          isLoadingMessages: false,
          error: null
        }));
      },
      (error) => {
        const errorMessage = error.message || 'Erro ao escutar mensagens';
        setState(prev => ({
          ...prev,
          isLoadingMessages: false,
          error: errorMessage
        }));
        
        toast({
          title: 'Erro na conexão',
          description: errorMessage,
          variant: 'destructive'
        });
      },
      limit
    );
    
    return unsubscribe;
  }, [convertFirebaseMessage, toast]);

  // Enviar mensagem
  const sendMessage = useCallback(async (
    chatId: string,
    content: string,
    type: 'text' | 'image' | 'file' | 'audio' = 'text',
    attachmentUrl?: string,
    attachmentName?: string
  ) => {
    if (!user?.id || !user?.name) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return false;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await FirebaseFirestoreService.sendMessage({
        chatId,
        content,
        senderId: user.id,
        senderName: user.name,
        type,
        attachmentUrl,
        attachmentName
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      toast({
        title: 'Erro ao enviar mensagem',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }
  }, [user?.id, user?.name, toast]);

  // Criar ou buscar chat
  const createOrGetChat = useCallback(async (otherUserId: string, otherUserName: string) => {
    if (!user?.id || !user?.name) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return null;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const chat = await FirebaseFirestoreService.createOrGetChat(
        user.id,
        user.name,
        otherUserId,
        otherUserName
      );
      
      setState(prev => ({ ...prev, isLoading: false }));
      return chat.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar chat';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      toast({
        title: 'Erro ao criar chat',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    }
  }, [user?.id, user?.name, toast]);

  // Marcar mensagens como lidas
  const markMessagesAsRead = useCallback(async (chatId: string) => {
    if (!user?.id) return;
    
    try {
      await FirebaseFirestoreService.markMessagesAsRead(chatId, user.id);
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  }, [user?.id]);

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Limpar chat atual
  const clearCurrentChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      currentChatId: null
    }));
  }, []);

  // Inicializar chats quando o usuário estiver logado
  useEffect(() => {
    if (user?.id) {
      const unsubscribe = listenToUserChats();
      return unsubscribe;
    } else {
      // Limpar estado quando usuário não estiver logado
      setState({
        messages: [],
        chats: [],
        currentChatId: null,
        isLoading: false,
        isLoadingMessages: false,
        isLoadingChats: false,
        error: null
      });
    }
  }, [user?.id, listenToUserChats]);

  return {
    // Estado
    messages: state.messages,
    chats: state.chats,
    currentChatId: state.currentChatId,
    isLoading: state.isLoading,
    isLoadingMessages: state.isLoadingMessages,
    isLoadingChats: state.isLoadingChats,
    error: state.error,
    
    // Ações
    loadUserChats,
    listenToUserChats,
    loadChatMessages,
    listenToChatMessages,
    sendMessage,
    createOrGetChat,
    markMessagesAsRead,
    clearError,
    clearCurrentChat
  };
};

export default useFirebaseChat;