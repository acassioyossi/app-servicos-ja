/**
 * Testes para API de usuários
 * Wayne App - Sistema de Mensagens
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/users/route';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth-service';

// Mock das dependências
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-service', () => ({
  verifyAccessToken: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

describe('/api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatar: null,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockAuthUser = {
    id: 'auth-user-1',
    email: 'auth@example.com',
    name: 'Auth User',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('GET /api/users', () => {
    it('deve retornar lista de usuários para usuário autenticado', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toEqual([{
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        avatar: mockUser.avatar,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      }]);
      expect(data.total).toBe(1);
    });

    it('deve aplicar filtros de busca', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/users?search=test&isActive=true&page=1&limit=10',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: 'test', mode: 'insensitive' } },
                { email: { contains: 'test', mode: 'insensitive' } },
              ],
            },
            { isActive: true },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('deve retornar erro 401 para usuário não autenticado', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'GET',
      });

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Token de acesso requerido');
    });

    it('deve retornar erro 401 para token inválido', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: false,
        error: 'Token inválido',
      });

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Token inválido');
    });

    it('deve tratar erros de banco de dados', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Erro interno do servidor');
    });
  });

  describe('POST /api/users', () => {
    it('deve criar novo usuário com dados válidos', async () => {
      // Arrange
      const newUserData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: newUserData,
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      const createdUser = {
        ...mockUser,
        id: 'new-user-id',
        email: newUserData.email,
        name: newUserData.name,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null); // Email não existe
      mockPrisma.user.create.mockResolvedValue(createdUser);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(newUserData.email);
      expect(data.user.name).toBe(newUserData.name);
      expect(data.user).not.toHaveProperty('passwordHash');
    });

    it('deve retornar erro para email já existente', async () => {
      // Arrange
      const newUserData = {
        email: 'existing@example.com',
        name: 'New User',
        password: 'password123',
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: newUserData,
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser); // Email já existe

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email já está em uso');
    });

    it('deve retornar erro para dados inválidos', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        name: '',
        password: '123', // Muito curta
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: invalidData,
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe('PUT /api/users/:id', () => {
    it('deve atualizar usuário existente', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Name',
        avatar: 'new-avatar.jpg',
      };

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/users/user-1',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: updateData,
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      const updatedUser = {
        ...mockUser,
        name: updateData.name,
        avatar: updateData.avatar,
        updatedAt: new Date(),
      };
      
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe(updateData.name);
      expect(data.user.avatar).toBe(updateData.avatar);
    });

    it('deve retornar erro 404 para usuário não encontrado', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/users/nonexistent-id',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: { name: 'Updated Name' },
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Usuário não encontrado');
    });

    it('deve permitir que usuário atualize próprio perfil', async () => {
      // Arrange
      const updateData = { name: 'Self Updated Name' };

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/users/auth-user-1',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: updateData,
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockAuthUser);
      
      const updatedUser = {
        ...mockAuthUser,
        name: updateData.name,
        updatedAt: new Date(),
      };
      
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe(updateData.name);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deve desativar usuário existente', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/users/user-1',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      const deactivatedUser = {
        ...mockUser,
        isActive: false,
        updatedAt: new Date(),
      };
      
      mockPrisma.user.update.mockResolvedValue(deactivatedUser);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
        select: expect.any(Object),
      });
    });

    it('deve retornar erro 404 para usuário não encontrado', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/users/nonexistent-id',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Usuário não encontrado');
    });

    it('deve impedir que usuário delete própria conta', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/users/auth-user-1',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockVerifyAccessToken.mockResolvedValue({
        success: true,
        user: mockAuthUser,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockAuthUser);

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Não é possível desativar sua própria conta');
    });
  });

  describe('Método não suportado', () => {
    it('deve retornar erro 405 para método PATCH', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'PATCH',
      });

      // Act
      const response = await handler(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Método não permitido');
    });
  });
});