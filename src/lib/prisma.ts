/**
 * Prisma Client Configuration
 * Singleton pattern for database connection
 */

import { PrismaClient } from '@prisma/client';

// Extend global namespace for development hot reload
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client instance
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });
};

// Use singleton pattern to prevent multiple instances
const prisma = globalThis.__prisma ?? createPrismaClient();

// In development, store the client globally to prevent hot reload issues
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };

/**
 * Database connection utilities
 */
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    return false;
  }
}

export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Disconnected from database successfully');
  } catch (error) {
    console.error('❌ Failed to disconnect from database:', error);
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
}> {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: 'healthy',
      message: 'Database connection is working',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Transaction wrapper for complex operations
 */
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

/**
 * Cleanup function for graceful shutdown
 */
export async function cleanup() {
  await disconnectFromDatabase();
}

// Handle process termination
process.on('beforeExit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);