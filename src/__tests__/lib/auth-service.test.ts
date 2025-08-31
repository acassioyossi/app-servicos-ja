/**
 * Testes para o serviço de autenticação
 * Wayne App - Sistema de Mensagens
 */

import { authenticateUser, verifyAccessToken, refreshAccessToken, clearUserCache } from '@/lib/auth-service';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock das dependências
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userActivity: {
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache-service');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockCacheService.user = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as any;
    
    mockCacheService.session = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as any;
    
    mockCacheService.token = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as any;
  });

  describe('authenticateUser', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('deve autenticar usuário com credenciais válidas', async () => {
      // Arrange
      mockCacheService.user.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('access-token' as never);
      mockJwt.sign.mockReturnValue('refresh-token' as never);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.userActivity.create.mockResolvedValue({} as any);
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);

      // Act
      const result = await authenticateUser('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        isActive: mockUser.isActive,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      
      // Verificar se o cache foi atualizado
      expect(mockCacheService.user.set).toHaveBeenCalled();
      expect(mockCacheService.session.set).toHaveBeenCalled();
      expect(mockCacheService.token.set).toHaveBeenCalled();
    });

    it('deve retornar erro para usuário não encontrado', async () => {
      // Arrange
      mockCacheService.user.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authenticateUser('nonexistent@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Credenciais inválidas');
      expect(mockPrisma.userActivity.create).toHaveBeenCalledWith({
        data: {
          userId: null,
          action: 'login_failed',
          details: { email: 'nonexistent@example.com', reason: 'user_not_found' },
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
    });

    it('deve retornar erro para senha incorreta', async () => {
      // Arrange
      mockCacheService.user.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await authenticateUser('test@example.com', 'wrongpassword');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Credenciais inválidas');
      expect(mockPrisma.userActivity.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          action: 'login_failed',
          details: { email: 'test@example.com', reason: 'invalid_password' },
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
    });

    it('deve retornar erro para usuário inativo', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockCacheService.user.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await authenticateUser('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Conta desativada');
    });

    it('deve usar dados do cache quando disponível', async () => {
      // Arrange
      const cachedUser = { ...mockUser, passwordHash: 'cached' };
      mockCacheService.user.get.mockResolvedValue(cachedUser);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('access-token' as never);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.userActivity.create.mockResolvedValue({} as any);
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);

      // Act
      const result = await authenticateUser('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCacheService.user.get).toHaveBeenCalledWith('user:test@example.com');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2); // Uma para cache, outra para senha
    });
  });

  describe('verifyAccessToken', () => {
    const mockTokenPayload = {
      userId: 'user-1',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('deve verificar token válido do cache', async () => {
      // Arrange
      const cachedData = {
        userId: mockTokenPayload.userId,
        email: mockTokenPayload.email,
        user: mockUser,
      };
      mockCacheService.token.get.mockResolvedValue(cachedData);

      // Act
      const result = await verifyAccessToken('valid-token');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockCacheService.token.get).toHaveBeenCalledWith('token:valid-token');
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('deve verificar token válido sem cache', async () => {
      // Arrange
      mockCacheService.token.get.mockResolvedValue(null);
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await verifyAccessToken('valid-token');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockCacheService.token.set).toHaveBeenCalled();
    });

    it('deve retornar erro para token inválido', async () => {
      // Arrange
      mockCacheService.token.get.mockResolvedValue(null);
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await verifyAccessToken('invalid-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Token inválido');
    });

    it('deve retornar erro para usuário não encontrado', async () => {
      // Arrange
      mockCacheService.token.get.mockResolvedValue(null);
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await verifyAccessToken('valid-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não encontrado');
    });

    it('deve retornar erro para usuário inativo', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockCacheService.token.get.mockResolvedValue(null);
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      // Act
      const result = await verifyAccessToken('valid-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário inativo');
    });
  });

  describe('refreshAccessToken', () => {
    const mockRefreshToken = {
      id: 'refresh-1',
      token: 'refresh-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      isRevoked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('deve renovar token com refresh token válido', async () => {
      // Arrange
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshToken,
        user: mockUser,
      } as any);
      mockJwt.sign.mockReturnValue('new-access-token' as never);
      mockPrisma.refreshToken.update.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await refreshAccessToken('refresh-token');

      // Assert
      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.user).toEqual(mockUser);
      expect(mockCacheService.token.set).toHaveBeenCalled();
    });

    it('deve retornar erro para refresh token não encontrado', async () => {
      // Arrange
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      // Act
      const result = await refreshAccessToken('invalid-refresh-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token inválido');
    });

    it('deve retornar erro para refresh token expirado', async () => {
      // Arrange
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expirado
        user: mockUser,
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(expiredToken as any);

      // Act
      const result = await refreshAccessToken('expired-refresh-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token expirado');
    });

    it('deve retornar erro para refresh token revogado', async () => {
      // Arrange
      const revokedToken = {
        ...mockRefreshToken,
        isRevoked: true,
        user: mockUser,
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(revokedToken as any);

      // Act
      const result = await refreshAccessToken('revoked-refresh-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token revogado');
    });
  });

  describe('clearUserCache', () => {
    it('deve limpar cache do usuário', async () => {
      // Arrange
      const userId = 'user-1';
      const email = 'test@example.com';

      // Act
      await clearUserCache(userId, email);

      // Assert
      expect(mockCacheService.user.delete).toHaveBeenCalledWith(`user:${email}`);
      expect(mockCacheService.session.delete).toHaveBeenCalledWith(`session:${userId}`);
    });

    it('deve limpar cache apenas com userId', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      await clearUserCache(userId);

      // Assert
      expect(mockCacheService.session.delete).toHaveBeenCalledWith(`session:${userId}`);
      expect(mockCacheService.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erros de banco de dados na autenticação', async () => {
      // Arrange
      mockCacheService.user.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await authenticateUser('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro interno do servidor');
    });

    it('deve tratar erros de cache na verificação de token', async () => {
      // Arrange
      mockCacheService.token.get.mockRejectedValue(new Error('Cache error'));
      mockJwt.verify.mockReturnValue({
        userId: 'user-1',
        email: 'test@example.com',
      } as never);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
      } as any);

      // Act
      const result = await verifyAccessToken('valid-token');

      // Assert
      expect(result.success).toBe(true); // Deve continuar funcionando mesmo com erro de cache
    });
  });
});