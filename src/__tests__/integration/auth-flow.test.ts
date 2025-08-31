/**
 * Testes de integração para fluxo de autenticação
 * Wayne App - Sistema de Mensagens
 */

import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Importar handlers das APIs
import loginHandler from '@/app/api/auth/login/route';
import registerHandler from '@/app/api/auth/register/route';
import refreshHandler from '@/app/api/auth/refresh/route';
import logoutHandler from '@/app/api/auth/logout/route';
import usersHandler from '@/app/api/users/route';

// Mock do Prisma para testes de integração
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    userActivity: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock do CacheService
jest.mock('@/lib/cache-service', () => ({
  CacheService: {
    user: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
    token: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('Fluxo de Autenticação - Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  });

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2a$10$hashedpassword',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('Fluxo completo de registro e login', () => {
    it('deve registrar usuário, fazer login e acessar recursos protegidos', async () => {
      // 1. Registro de usuário
      const registerData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const { req: registerReq } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: registerData,
      });

      // Mock para verificar se email não existe
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      
      // Mock para criar usuário
      const newUser = {
        ...mockUser,
        id: 'new-user-id',
        email: registerData.email,
        name: registerData.name,
      };
      mockPrisma.user.create.mockResolvedValueOnce(newUser);
      mockPrisma.userActivity.create.mockResolvedValueOnce({} as any);

      const registerResponse = await registerHandler(registerReq as any);
      const registerResult = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerResult.success).toBe(true);
      expect(registerResult.user.email).toBe(registerData.email);

      // 2. Login com o usuário criado
      const loginData = {
        email: registerData.email,
        password: registerData.password,
      };

      const { req: loginReq } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: loginData,
      });

      // Mock para cache (não encontrado)
      mockCacheService.user.get.mockResolvedValueOnce(null);
      
      // Mock para buscar usuário
      mockPrisma.user.findUnique.mockResolvedValueOnce(newUser);
      
      // Mock para verificação de senha
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      
      // Mock para atualização de último login
      mockPrisma.user.update.mockResolvedValueOnce(newUser);
      
      // Mock para criação de refresh token
      mockPrisma.refreshToken.create.mockResolvedValueOnce({
        id: 'refresh-1',
        token: 'refresh-token-value',
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock para atividades
      mockPrisma.userActivity.create.mockResolvedValueOnce({} as any);

      const loginResponse = await loginHandler(loginReq as any);
      const loginResult = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginResult.success).toBe(true);
      expect(loginResult.user.email).toBe(registerData.email);
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();

      // 3. Acessar recurso protegido com o token
      const { req: usersReq } = createMocks({
        method: 'GET',
        headers: {
          authorization: `Bearer ${loginResult.accessToken}`,
        },
      });

      // Mock para verificação de token (cache não encontrado)
      mockCacheService.token.get.mockResolvedValueOnce(null);
      
      // Mock para buscar usuário na verificação do token
      mockPrisma.user.findUnique.mockResolvedValueOnce(newUser);
      
      // Mock para listar usuários
      mockPrisma.user.findMany.mockResolvedValueOnce([newUser]);

      const usersResponse = await usersHandler(usersReq as any);
      const usersResult = await usersResponse.json();

      expect(usersResponse.status).toBe(200);
      expect(usersResult.success).toBe(true);
      expect(usersResult.users).toHaveLength(1);
      expect(usersResult.users[0].email).toBe(registerData.email);
    });
  });

  describe('Fluxo de refresh token', () => {
    it('deve renovar access token usando refresh token válido', async () => {
      const refreshTokenValue = 'valid-refresh-token';
      
      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { refreshToken: refreshTokenValue },
      });

      // Mock para buscar refresh token
      const mockRefreshToken = {
        id: 'refresh-1',
        token: refreshTokenValue,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };
      
      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(mockRefreshToken as any);
      mockPrisma.refreshToken.update.mockResolvedValueOnce(mockRefreshToken);

      const response = await refreshHandler(req as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      
      // Verificar se o cache foi atualizado
      expect(mockCacheService.token.set).toHaveBeenCalled();
    });

    it('deve rejeitar refresh token expirado', async () => {
      const expiredRefreshToken = 'expired-refresh-token';
      
      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { refreshToken: expiredRefreshToken },
      });

      // Mock para refresh token expirado
      const mockExpiredToken = {
        id: 'refresh-1',
        token: expiredRefreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 1000), // Expirado
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };
      
      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(mockExpiredToken as any);

      const response = await refreshHandler(req as any);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token expirado');
    });
  });

  describe('Fluxo de logout', () => {
    it('deve fazer logout e revogar refresh token', async () => {
      const refreshTokenValue = 'valid-refresh-token';
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer valid-access-token',
        },
        body: { refreshToken: refreshTokenValue },
      });

      // Mock para verificação do access token
      mockCacheService.token.get.mockResolvedValueOnce({
        userId: mockUser.id,
        email: mockUser.email,
        user: mockUser,
      });

      // Mock para buscar e revogar refresh token
      const mockRefreshToken = {
        id: 'refresh-1',
        token: refreshTokenValue,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(mockRefreshToken);
      mockPrisma.refreshToken.update.mockResolvedValueOnce({
        ...mockRefreshToken,
        isRevoked: true,
      });
      
      // Mock para atividade de logout
      mockPrisma.userActivity.create.mockResolvedValueOnce({} as any);

      const response = await logoutHandler(req as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      
      // Verificar se o cache foi limpo
      expect(mockCacheService.token.delete).toHaveBeenCalled();
      expect(mockCacheService.session.delete).toHaveBeenCalled();
      expect(mockCacheService.user.delete).toHaveBeenCalled();
    });
  });

  describe('Fluxo com cache', () => {
    it('deve usar dados do cache quando disponível', async () => {
      const loginData = {
        email: mockUser.email,
        password: 'password123',
      };

      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: loginData,
      });

      // Mock para usuário em cache
      const cachedUser = {
        ...mockUser,
        passwordHash: 'cached', // Indica que veio do cache
      };
      
      mockCacheService.user.get.mockResolvedValueOnce(cachedUser);
      
      // Mock para buscar senha real do banco
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Mock para verificação de senha
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      
      // Mocks para o resto do fluxo
      mockPrisma.user.update.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValueOnce({
        id: 'refresh-1',
        token: 'refresh-token-value',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.userActivity.create.mockResolvedValueOnce({} as any);

      const response = await loginHandler(req as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      
      // Verificar se o cache foi consultado
      expect(mockCacheService.user.get).toHaveBeenCalledWith(`user:${mockUser.email}`);
      
      // Verificar se os dados foram atualizados no cache
      expect(mockCacheService.user.set).toHaveBeenCalled();
      expect(mockCacheService.session.set).toHaveBeenCalled();
      expect(mockCacheService.token.set).toHaveBeenCalled();
    });
  });

  describe('Tratamento de erros', () => {
    it('deve tratar erro de banco de dados durante login', async () => {
      const loginData = {
        email: mockUser.email,
        password: 'password123',
      };

      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: loginData,
      });

      // Mock para cache vazio
      mockCacheService.user.get.mockResolvedValueOnce(null);
      
      // Mock para erro de banco
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await loginHandler(req as any);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro interno do servidor');
    });

    it('deve tratar erro de cache graciosamente', async () => {
      const loginData = {
        email: mockUser.email,
        password: 'password123',
      };

      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: loginData,
      });

      // Mock para erro de cache
      mockCacheService.user.get.mockRejectedValueOnce(new Error('Cache connection failed'));
      
      // Mock para busca no banco (fallback)
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Mock para verificação de senha
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      
      // Mocks para o resto do fluxo
      mockPrisma.user.update.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValueOnce({
        id: 'refresh-1',
        token: 'refresh-token-value',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.userActivity.create.mockResolvedValueOnce({} as any);

      const response = await loginHandler(req as any);
      const result = await response.json();

      // Deve continuar funcionando mesmo com erro de cache
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });
  });

  describe('Segurança', () => {
    it('deve prevenir ataques de força bruta', async () => {
      const loginData = {
        email: mockUser.email,
        password: 'wrongpassword',
      };

      // Simular múltiplas tentativas de login falhadas
      for (let i = 0; i < 5; i++) {
        const { req } = createMocks({
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: loginData,
        });

        mockCacheService.user.get.mockResolvedValueOnce(null);
        mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);
        mockPrisma.userActivity.create.mockResolvedValueOnce({} as any);

        const response = await loginHandler(req as any);
        const result = await response.json();

        expect(response.status).toBe(401);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Credenciais inválidas');
      }

      // Verificar se as atividades de falha foram registradas
      expect(mockPrisma.userActivity.create).toHaveBeenCalledTimes(5);
    });

    it('deve validar formato de email', async () => {
      const invalidEmailData = {
        email: 'invalid-email-format',
        password: 'password123',
      };

      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: invalidEmailData,
      });

      const response = await loginHandler(req as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('deve validar força da senha no registro', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        name: 'Test User',
        password: '123', // Senha muito fraca
      };

      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: weakPasswordData,
      });

      const response = await registerHandler(req as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});