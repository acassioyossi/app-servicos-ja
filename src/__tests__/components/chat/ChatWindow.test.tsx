/**
 * Testes para o componente ChatWindow
 * Wayne App - Sistema de Mensagens
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { testUtils } from '../../setup';

// Mock dos hooks
jest.mock('@/hooks/useMessages', () => ({
  useMessages: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseMessages = require('@/hooks/useMessages').useMessages;
const mockUseAuth = require('@/hooks/useAuth').useAuth;

describe('ChatWindow', () => {
  const mockUser = testUtils.createMockUser({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  });

  const mockRecipient = testUtils.createMockUser({
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
  });

  const mockMessages = [
    testUtils.createMockMessage({
      id: 'msg-1',
      content: 'Hello, how are you?',
      senderId: 'user-1',
      receiverId: 'user-2',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    }),
    testUtils.createMockMessage({
      id: 'msg-2',
      content: 'I am fine, thank you!',
      senderId: 'user-2',
      receiverId: 'user-1',
      createdAt: new Date('2024-01-01T10:05:00Z'),
    }),
  ];

  const defaultProps = {
    recipientId: 'user-2',
    recipient: mockRecipient,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
    });

    mockUseMessages.mockReturnValue({
      messages: mockMessages,
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      markAsRead: jest.fn(),
      deleteMessage: jest.fn(),
      refreshMessages: jest.fn(),
    });
  });

  describe('Renderização', () => {
    it('deve renderizar o cabeçalho do chat com informações do destinatário', () => {
      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('deve renderizar a lista de mensagens', () => {
      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText('I am fine, thank you!')).toBeInTheDocument();
    });

    it('deve renderizar o campo de entrada de mensagem', () => {
      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
    });

    it('deve mostrar indicador de carregamento quando loading é true', () => {
      mockUseMessages.mockReturnValue({
        messages: [],
        loading: true,
        error: null,
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByText('Carregando mensagens...')).toBeInTheDocument();
    });

    it('deve mostrar mensagem de erro quando há erro', () => {
      mockUseMessages.mockReturnValue({
        messages: [],
        loading: false,
        error: 'Erro ao carregar mensagens',
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByText('Erro ao carregar mensagens')).toBeInTheDocument();
    });

    it('deve mostrar mensagem quando não há mensagens', () => {
      mockUseMessages.mockReturnValue({
        messages: [],
        loading: false,
        error: null,
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByText('Nenhuma mensagem ainda. Inicie a conversa!')).toBeInTheDocument();
    });
  });

  describe('Envio de mensagens', () => {
    it('deve enviar mensagem quando o formulário é submetido', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue({ success: true });
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.type(input, 'Nova mensagem de teste');
      await user.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith({
        content: 'Nova mensagem de teste',
        receiverId: 'user-2',
        type: 'text',
      });

      // Campo deve ser limpo após envio
      expect(input).toHaveValue('');
    });

    it('deve enviar mensagem ao pressionar Enter', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue({ success: true });
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const input = screen.getByPlaceholderText('Digite sua mensagem...');

      await user.type(input, 'Mensagem com Enter{enter}');

      expect(mockSendMessage).toHaveBeenCalledWith({
        content: 'Mensagem com Enter',
        receiverId: 'user-2',
        type: 'text',
      });
    });

    it('não deve enviar mensagem vazia', async () => {
      const mockSendMessage = jest.fn();
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.click(sendButton);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('não deve enviar mensagem com apenas espaços', async () => {
      const mockSendMessage = jest.fn();
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.type(input, '   ');
      await user.click(sendButton);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('deve mostrar erro quando falha ao enviar mensagem', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue({
        success: false,
        error: 'Erro ao enviar mensagem',
      });
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.type(input, 'Mensagem que falhará');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Erro ao enviar mensagem')).toBeInTheDocument();
      });
    });
  });

  describe('Interações com mensagens', () => {
    it('deve marcar mensagem como lida ao clicar', async () => {
      const mockMarkAsRead = jest.fn().mockResolvedValue({ success: true });
      mockUseMessages.mockReturnValue({
        messages: [{
          ...mockMessages[1],
          isRead: false,
        }],
        loading: false,
        error: null,
        sendMessage: jest.fn(),
        markAsRead: mockMarkAsRead,
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const messageElement = screen.getByText('I am fine, thank you!');
      await user.click(messageElement);

      expect(mockMarkAsRead).toHaveBeenCalledWith('msg-2');
    });

    it('deve deletar mensagem ao clicar no botão de deletar', async () => {
      const mockDeleteMessage = jest.fn().mockResolvedValue({ success: true });
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        error: null,
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        deleteMessage: mockDeleteMessage,
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      // Assumindo que há um botão de deletar para mensagens do usuário atual
      const deleteButtons = screen.getAllByRole('button', { name: /deletar/i });
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        expect(mockDeleteMessage).toHaveBeenCalled();
      }
    });
  });

  describe('Formatação de mensagens', () => {
    it('deve aplicar classe CSS diferente para mensagens enviadas e recebidas', () => {
      render(<ChatWindow {...defaultProps} />);

      const sentMessage = screen.getByText('Hello, how are you?').closest('.message');
      const receivedMessage = screen.getByText('I am fine, thank you!').closest('.message');

      expect(sentMessage).toHaveClass('message-sent');
      expect(receivedMessage).toHaveClass('message-received');
    });

    it('deve mostrar timestamp das mensagens', () => {
      render(<ChatWindow {...defaultProps} />);

      // Assumindo que o timestamp é mostrado em formato legível
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
      expect(screen.getByText(/10:05/)).toBeInTheDocument();
    });

    it('deve mostrar indicador de mensagem não lida', () => {
      const unreadMessages = [
        {
          ...mockMessages[1],
          isRead: false,
        },
      ];

      mockUseMessages.mockReturnValue({
        messages: unreadMessages,
        loading: false,
        error: null,
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByTestId('unread-indicator')).toBeInTheDocument();
    });
  });

  describe('Scroll automático', () => {
    it('deve fazer scroll para a última mensagem ao carregar', () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(<ChatWindow {...defaultProps} />);

      expect(scrollIntoViewMock).toHaveBeenCalled();
    });

    it('deve fazer scroll para a última mensagem ao enviar nova mensagem', async () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const mockSendMessage = jest.fn().mockResolvedValue({ success: true });
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.type(input, 'Nova mensagem');
      await user.click(sendButton);

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledTimes(2); // Uma no mount, outra após envio
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para screen readers', () => {
      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByLabelText('Campo de mensagem')).toBeInTheDocument();
      expect(screen.getByLabelText('Enviar mensagem')).toBeInTheDocument();
    });

    it('deve ter navegação por teclado funcional', async () => {
      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      // Tab deve navegar do input para o botão
      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(sendButton).toHaveFocus();
    });

    it('deve ter contraste adequado para mensagens', () => {
      render(<ChatWindow {...defaultProps} />);

      const messages = screen.getAllByRole('listitem');
      messages.forEach(message => {
        const styles = window.getComputedStyle(message);
        // Verificar se há contraste suficiente (implementação simplificada)
        expect(styles.color).not.toBe(styles.backgroundColor);
      });
    });
  });

  describe('Estados de carregamento', () => {
    it('deve desabilitar botão de envio durante envio de mensagem', async () => {
      const mockSendMessage = jest.fn(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: true }), 1000)
      ));
      
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markAsRead: jest.fn(),
        deleteMessage: jest.fn(),
        refreshMessages: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChatWindow {...defaultProps} />);

      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.type(input, 'Mensagem de teste');
      await user.click(sendButton);

      expect(sendButton).toBeDisabled();
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
    });
  });
});