"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number; // for audio/video
    thumbnailUrl?: string; // for images/videos
  };
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, type?: Message['type'], metadata?: Message['metadata']) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  isConnected: boolean;
}

export function useMessages(
  currentUserId: string,
  targetUserId?: string,
  options?: {
    limit?: number;
    autoConnect?: boolean;
    enableRealtime?: boolean;
  }
): UseMessagesReturn {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const limit = options?.limit || 50;
  const autoConnect = options?.autoConnect !== false;
  const enableRealtime = options?.enableRealtime !== false;

  // Load initial messages
  const loadMessages = useCallback(async (offset = 0) => {
    try {
      setError(null);
      if (offset === 0) setLoading(true);
      
      const params = new URLSearchParams({
        userId: currentUserId,
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (targetUserId) {
        params.append('targetUserId', targetUserId);
      }
      
      const response = await fetch(`/api/messages?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      const newMessages = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      
      if (offset === 0) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }
      
      setHasMoreMessages(newMessages.length === limit);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Erro ao carregar mensagens',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetUserId, limit, toast]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || loading) return;
    await loadMessages(messages.length);
  }, [hasMoreMessages, loading, loadMessages, messages.length]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    type: Message['type'] = 'text',
    metadata?: Message['metadata']
  ) => {
    if (!content.trim() && type === 'text') return;
    
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content,
      senderId: currentUserId,
      receiverId: targetUserId || '',
      timestamp: new Date(),
      type,
      status: 'sending',
      metadata,
    };
    
    // Add message optimistically
    setMessages(prev => [tempMessage, ...prev]);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          receiverId: targetUserId,
          type,
          metadata,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const sentMessage = await response.json();
      
      // Replace temp message with real message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...sentMessage, timestamp: new Date(sentMessage.timestamp) }
            : msg
        )
      );
      
    } catch (err) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      toast({
        title: 'Erro ao enviar mensagem',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [currentUserId, targetUserId, toast]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
      });
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'read' }
            : msg
        )
      );
      
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      toast({
        title: 'Erro ao deletar mensagem',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to edit message');
      }
      
      const updatedMessage = await response.json();
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...updatedMessage, timestamp: new Date(updatedMessage.timestamp) }
            : msg
        )
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
      toast({
        title: 'Erro ao editar mensagem',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!enableRealtime || wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/messages?userId=${currentUserId}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_message') {
            const newMessage = {
              ...data.message,
              timestamp: new Date(data.message.timestamp),
            };
            
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [newMessage, ...prev];
            });
          } else if (data.type === 'message_updated') {
            const updatedMessage = {
              ...data.message,
              timestamp: new Date(data.message.timestamp),
            };
            
            setMessages(prev => 
              prev.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          } else if (data.type === 'message_deleted') {
            setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, [enableRealtime, currentUserId]);

  // Initialize
  useEffect(() => {
    if (autoConnect) {
      loadMessages();
      if (enableRealtime) {
        connectWebSocket();
      }
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, loadMessages, connectWebSocket, enableRealtime]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    deleteMessage,
    editMessage,
    loadMoreMessages,
    hasMoreMessages,
    isConnected,
  };
}