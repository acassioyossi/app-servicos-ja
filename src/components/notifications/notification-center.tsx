"use client";

import React from 'react';
import { Bell, Check, X, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/notification-context';
import { sanitizeText } from '@/lib/sanitize';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScreenReaderOnly } from '@/components/accessibility/accessibility-utils';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionLabel?: string;
    actionCallback?: () => void;
  };
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onRemove }: NotificationItemProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      role="listitem"
      aria-labelledby={`notification-title-${notification.id}`}
      aria-describedby={`notification-message-${notification.id}`}
      className={cn(
        'p-3 border-l-4 bg-card hover:bg-accent/50 transition-colors',
        notification.read ? 'opacity-70' : '',
        notification.type === 'success' && 'border-l-green-500',
        notification.type === 'warning' && 'border-l-yellow-500',
        notification.type === 'error' && 'border-l-red-500',
        notification.type === 'info' && 'border-l-blue-500'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm" aria-hidden="true">{getTypeIcon(notification.type)}</span>
            <h4 id={`notification-title-${notification.id}`} className="text-sm font-medium truncate">{sanitizeText(notification.title)}</h4>
            {!notification.read && (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" aria-hidden="true" />
                <ScreenReaderOnly>Nova notificação</ScreenReaderOnly>
              </>
            )}
          </div>
          <p id={`notification-message-${notification.id}`} className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {sanitizeText(notification.message)}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(notification.timestamp, {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {notification.actionLabel && notification.actionCallback && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={notification.actionCallback}
                aria-label={`${notification.actionLabel} para notificação: ${notification.title}`}
              >
                {notification.actionLabel}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMarkAsRead(notification.id)}
              aria-label={`Marcar como lida: ${notification.title}`}
              title="Marcar como lida"
            >
              <Check className="h-3 w-3" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(notification.id)}
            aria-label={`Remover notificação: ${notification.title}`}
            title="Remover notificação"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          aria-label={unreadCount > 0 
            ? `Notificações - ${unreadCount} não lidas` 
            : 'Notificações - nenhuma nova notificação'
          }
          aria-expanded={false}
          aria-haspopup="menu"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <ScreenReaderOnly>
            {unreadCount > 0
              ? `${unreadCount} notificações não lidas`
              : 'Nenhuma notificação nova'}
          </ScreenReaderOnly>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        role="menu"
        aria-label="Menu de notificações"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 id="notifications-heading" className="font-semibold">Notificações</h3>
          <div className="flex gap-2" role="group" aria-label="Ações das notificações">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 px-2 text-xs"
                aria-label={`Marcar todas as ${unreadCount} notificações como lidas`}
              >
                <CheckCheck className="h-3 w-3 mr-1" aria-hidden="true" />
                Marcar todas como lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                aria-label={`Limpar todas as ${notifications.length} notificações`}
              >
                <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
                Limpar todas
              </Button>
            )}
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" role="status" aria-live="polite">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          <ScrollArea className="h-96" aria-labelledby="notifications-heading">
            <div 
              className="space-y-1 p-2" 
              role="list" 
              aria-label={`Lista de ${notifications.length} notificações`}
            >
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onRemove={removeNotification}
                  />
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" aria-hidden="true" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}