/**
 * Servidor de Mock usando MSW (Mock Service Worker)
 * Wayne App - Sistema de Mensagens
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Dados de mock
const mockUsers = [
  {
    id: 'user-1',
    email: 'john@example.com',
    name: 'John Doe',
    avatar: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    avatar: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello, how are you?',
    senderId: 'user-1',
    receiverId: 'user-2',
    type: 'text',
    isRead: false,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'msg-2',
    content: 'I am fine, thank you!',
    senderId: 'user-2',
    receiverId: 'user-1',
    type: 'text',
    isRead: true,
    createdAt: '2024-01-01T10:05:00Z',
    updatedAt: '2024-01-01T10:05:00Z',
  },
];

const mockTransactions = [
  {
    id: 'txn-1',
    senderId: 'user-1',
    receiverId: 'user-2',
    amount: 100.00,
    currency: 'USD',
    status: 'completed',
    type: 'transfer',
    description: 'Payment for services',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
  },
];

// Handlers para as APIs
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        user: mockUsers[0],
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        user: {
          id: 'new-user-id',
          email: 'newuser@example.com',
          name: 'New User',
          avatar: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),

  rest.post('/api/auth/refresh', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        accessToken: 'new-mock-access-token',
      })
    );
  }),

  // User endpoints
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        users: mockUsers,
        total: mockUsers.length,
      })
    );
  }),

  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    const user = mockUsers.find(u => u.id === id);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, error: 'User not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({ success: true, user })
    );
  }),

  rest.put('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    const user = mockUsers.find(u => u.id === id);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, error: 'User not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        user: {
          ...user,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Message endpoints
  rest.get('/api/messages', (req, res, ctx) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    let filteredMessages = mockMessages;
    if (userId) {
      filteredMessages = mockMessages.filter(
        msg => msg.senderId === userId || msg.receiverId === userId
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        messages: filteredMessages,
        total: filteredMessages.length,
      })
    );
  }),

  rest.post('/api/messages', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: {
          id: 'new-msg-id',
          content: 'New message content',
          senderId: 'user-1',
          receiverId: 'user-2',
          type: 'text',
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }),

  rest.put('/api/messages/:id', (req, res, ctx) => {
    const { id } = req.params;
    const message = mockMessages.find(m => m.id === id);
    
    if (!message) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, error: 'Message not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: {
          ...message,
          isRead: true,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }),

  rest.delete('/api/messages/:id', (req, res, ctx) => {
    const { id } = req.params;
    const messageIndex = mockMessages.findIndex(m => m.id === id);
    
    if (messageIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, error: 'Message not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),

  // Transaction endpoints
  rest.get('/api/transactions', (req, res, ctx) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    let filteredTransactions = mockTransactions;
    if (userId) {
      filteredTransactions = mockTransactions.filter(
        txn => txn.senderId === userId || txn.receiverId === userId
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        transactions: filteredTransactions,
        total: filteredTransactions.length,
      })
    );
  }),

  rest.post('/api/transactions', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        transaction: {
          id: 'new-txn-id',
          senderId: 'user-1',
          receiverId: 'user-2',
          amount: 50.00,
          currency: 'USD',
          status: 'pending',
          type: 'transfer',
          description: 'New transaction',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }),

  rest.get('/api/transactions/:id', (req, res, ctx) => {
    const { id } = req.params;
    const transaction = mockTransactions.find(t => t.id === id);
    
    if (!transaction) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, error: 'Transaction not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({ success: true, transaction })
    );
  }),

  // Upload endpoint
  rest.post('/api/upload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        file: {
          id: 'file-id',
          filename: 'test-file.jpg',
          url: '/uploads/test-file.jpg',
          size: 1024,
          mimeType: 'image/jpeg',
        },
      })
    );
  }),

  // Health check
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
      })
    );
  }),

  // Fallback para requisições não tratadas
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`);
    return res(
      ctx.status(404),
      ctx.json({ success: false, error: 'Endpoint not found' })
    );
  }),
];

// Criar e configurar o servidor
export const server = setupServer(...handlers);

// Utilitários para testes
export const mockData = {
  users: mockUsers,
  messages: mockMessages,
  transactions: mockTransactions,
};

export const resetMockData = () => {
  // Função para resetar dados de mock se necessário
  mockUsers.length = 0;
  mockMessages.length = 0;
  mockTransactions.length = 0;
  
  // Recarregar dados iniciais
  mockUsers.push(
    {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      avatar: null,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      avatar: null,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }
  );
};