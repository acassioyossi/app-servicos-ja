import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/transactions/route';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth-service';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

jest.mock('@/lib/auth-service', () => ({
  verifyAccessToken: jest.fn()
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

describe('/api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAccessToken.mockResolvedValue({ userId: 'user1', email: 'user1@example.com' });
  });

  describe('GET /api/transactions', () => {
    it('returns user transactions successfully', async () => {
      const mockTransactions = [
        {
          id: 'tx1',
          amount: 100.50,
          type: 'INCOME',
          description: 'Salary',
          category: 'Work',
          userId: 'user1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'tx2',
          amount: 50.25,
          type: 'EXPENSE',
          description: 'Groceries',
          category: 'Food',
          userId: 'user1',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        }
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.transaction.count.mockResolvedValue(2);

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      await handler.GET(req as any);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0
      });
    });

    it('applies filters correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          type: 'INCOME',
          category: 'Work',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: '2',
          limit: '10'
        },
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.count.mockResolvedValue(0);

      await handler.GET(req as any);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          type: 'INCOME',
          category: 'Work',
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31')
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 10
      });
    });

    it('returns 401 when not authenticated', async () => {
      mockVerifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      const response = await handler.GET(req as any);
      expect(response.status).toBe(401);
    });

    it('handles database errors', async () => {
      mockPrisma.transaction.findMany.mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      const response = await handler.GET(req as any);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/transactions', () => {
    it('creates transaction successfully', async () => {
      const newTransaction = {
        id: 'tx3',
        amount: 75.00,
        type: 'EXPENSE',
        description: 'Gas',
        category: 'Transportation',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.transaction.create.mockResolvedValue(newTransaction);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          amount: 75.00,
          type: 'EXPENSE',
          description: 'Gas',
          category: 'Transportation'
        }
      });

      const response = await handler.POST(req as any);
      expect(response.status).toBe(201);

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: {
          amount: 75.00,
          type: 'EXPENSE',
          description: 'Gas',
          category: 'Transportation',
          userId: 'user1'
        }
      });
    });

    it('validates required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          amount: 75.00
          // Missing required fields
        }
      });

      const response = await handler.POST(req as any);
      expect(response.status).toBe(400);
    });

    it('validates amount is positive', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          amount: -50.00,
          type: 'EXPENSE',
          description: 'Invalid',
          category: 'Test'
        }
      });

      const response = await handler.POST(req as any);
      expect(response.status).toBe(400);
    });

    it('validates transaction type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          amount: 50.00,
          type: 'INVALID_TYPE',
          description: 'Test',
          category: 'Test'
        }
      });

      const response = await handler.POST(req as any);
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/transactions/[id]', () => {
    it('updates transaction successfully', async () => {
      const existingTransaction = {
        id: 'tx1',
        userId: 'user1',
        amount: 100.00,
        type: 'INCOME',
        description: 'Old description',
        category: 'Work'
      };

      const updatedTransaction = {
        ...existingTransaction,
        description: 'Updated description',
        amount: 150.00
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(existingTransaction as any);
      mockPrisma.transaction.update.mockResolvedValue(updatedTransaction as any);

      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          description: 'Updated description',
          amount: 150.00
        }
      });

      // Mock the dynamic route parameter
      (req as any).params = { id: 'tx1' };

      const response = await handler.PUT(req as any);
      expect(response.status).toBe(200);

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        data: {
          description: 'Updated description',
          amount: 150.00
        }
      });
    });

    it('returns 404 for non-existent transaction', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          description: 'Updated description'
        }
      });

      (req as any).params = { id: 'non-existent' };

      const response = await handler.PUT(req as any);
      expect(response.status).toBe(404);
    });

    it('prevents updating other users transactions', async () => {
      const otherUserTransaction = {
        id: 'tx1',
        userId: 'user2', // Different user
        amount: 100.00,
        type: 'INCOME',
        description: 'Other user transaction',
        category: 'Work'
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(otherUserTransaction as any);

      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          description: 'Hacked description'
        }
      });

      (req as any).params = { id: 'tx1' };

      const response = await handler.PUT(req as any);
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/transactions/[id]', () => {
    it('deletes transaction successfully', async () => {
      const existingTransaction = {
        id: 'tx1',
        userId: 'user1',
        amount: 100.00,
        type: 'INCOME',
        description: 'To be deleted',
        category: 'Work'
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(existingTransaction as any);
      mockPrisma.transaction.delete.mockResolvedValue(existingTransaction as any);

      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      (req as any).params = { id: 'tx1' };

      const response = await handler.DELETE(req as any);
      expect(response.status).toBe(200);

      expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'tx1' }
      });
    });

    it('returns 404 for non-existent transaction', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      (req as any).params = { id: 'non-existent' };

      const response = await handler.DELETE(req as any);
      expect(response.status).toBe(404);
    });

    it('prevents deleting other users transactions', async () => {
      const otherUserTransaction = {
        id: 'tx1',
        userId: 'user2',
        amount: 100.00,
        type: 'INCOME',
        description: 'Other user transaction',
        category: 'Work'
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(otherUserTransaction as any);

      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      (req as any).params = { id: 'tx1' };

      const response = await handler.DELETE(req as any);
      expect(response.status).toBe(403);
    });
  });

  describe('Unsupported methods', () => {
    it('returns 405 for unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      const response = await handler.PATCH?.(req as any);
      expect(response?.status).toBe(405);
    });
  });
});