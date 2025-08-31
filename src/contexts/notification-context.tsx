"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  subscribeToRealTime: () => void;
  unsubscribeFromRealTime: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Mostrar toast para notificações não persistentes
    if (!notification.persistent) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Simulação de WebSocket para notificações em tempo real
  const subscribeToRealTime = useCallback(() => {
    if (isSubscribed) return;

    setIsSubscribed(true);

    // Simulação de eventos em tempo real
    const interval = setInterval(() => {
      const eventTypes = [
        {
          type: 'info' as const,
          title: 'Novo serviço disponível',
          message: 'Um novo serviço foi encontrado na sua área',
          persistent: true,
        },
        {
          type: 'success' as const,
          title: 'Pagamento confirmado',
          message: 'Seu pagamento foi processado com sucesso',
          persistent: true,
        },
        {
          type: 'warning' as const,
          title: 'Serviço em andamento',
          message: 'O profissional está a caminho do local',
          persistent: true,
        },
      ];

      // 30% de chance de gerar uma notificação a cada 10 segundos
      if (Math.random() < 0.3) {
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        addNotification(randomEvent);
      }
    }, 10000); // A cada 10 segundos

    // Cleanup function
    return () => {
      clearInterval(interval);
      setIsSubscribed(false);
    };
  }, [isSubscribed, addNotification]);

  const unsubscribeFromRealTime = useCallback(() => {
    setIsSubscribed(false);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Auto-subscribe quando o componente monta
  useEffect(() => {
    const cleanup = subscribeToRealTime();
    return cleanup;
  }, [subscribeToRealTime]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    subscribeToRealTime,
    unsubscribeFromRealTime,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook para notificações específicas do sistema
export function useSystemNotifications() {
  const { addNotification } = useNotifications();

  const notifyServiceUpdate = useCallback((message: string) => {
    addNotification({
      type: 'info',
      title: 'Atualização do Serviço',
      message,
      persistent: true,
    });
  }, [addNotification]);

  const notifyPaymentSuccess = useCallback((amount: number) => {
    addNotification({
      type: 'success',
      title: 'Pagamento Confirmado',
      message: `Pagamento de R$ ${amount.toFixed(2)} processado com sucesso`,
      persistent: true,
    });
  }, [addNotification]);

  const notifyError = useCallback((message: string) => {
    addNotification({
      type: 'error',
      title: 'Erro',
      message,
      persistent: false,
    });
  }, [addNotification]);

  const notifyNewMessage = useCallback((from: string) => {
    addNotification({
      type: 'info',
      title: 'Nova Mensagem',
      message: `Você recebeu uma nova mensagem de ${from}`,
      persistent: true,
      actionLabel: 'Ver mensagem',
      actionCallback: () => {
        // Navegar para o chat
        window.location.href = '/dashboard/chat';
      },
    });
  }, [addNotification]);

  return {
    notifyServiceUpdate,
    notifyPaymentSuccess,
    notifyError,
    notifyNewMessage,
  };
}