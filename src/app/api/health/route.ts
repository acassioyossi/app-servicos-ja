import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Verificar cache primeiro
    const cachedHealth = await CacheService.temp.get('health_check');
    if (cachedHealth) {
      const response = NextResponse.json(cachedHealth, { status: 200 });
      applySecurityHeaders(response);
      return response;
    }
    
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Verificar saúde do banco de dados
    const dbHealth = await prisma.checkDatabaseHealth();
    
    // Verificar saúde do Redis
    const redisHealth = {
      isHealthy: CacheService.utils.isAvailable(),
      responseTime: 0,
      lastCheck: new Date().toISOString()
    };
    
    if (redisHealth.isHealthy) {
      const redisStartTime = Date.now();
      await CacheService.temp.set('redis_test', 'ok', 10);
      const testValue = await CacheService.temp.get('redis_test');
      redisHealth.responseTime = Date.now() - redisStartTime;
      redisHealth.isHealthy = testValue === 'ok';
      await CacheService.temp.del('redis_test');
    }
    
    const responseTime = Date.now() - startTime;
    const overallHealthy = dbHealth.isHealthy && redisHealth.isHealthy;
    
    const healthData = {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.isHealthy ? 'up' : 'down',
          responseTime: dbHealth.responseTime,
          lastCheck: dbHealth.lastCheck
        },
        redis: {
          status: redisHealth.isHealthy ? 'up' : 'down',
          responseTime: redisHealth.responseTime,
          lastCheck: redisHealth.lastCheck
        }
      },
      responseTime,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Cachear resultado por 30 segundos se tudo estiver saudável
    if (overallHealthy) {
      await CacheService.temp.set('health_check', healthData, 30);
    }
    
    const response = NextResponse.json(
      healthData,
      { status: overallHealthy ? 200 : 503 }
    );
    
    applySecurityHeaders(response);
    return response;
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResponse = NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        responseTime: Date.now() - startTime,
        services: {
          database: { status: 'unknown' },
          redis: { status: 'unknown' }
        }
      },
      { status: 503 }
    );
    
    applySecurityHeaders(errorResponse);
    return errorResponse;
  }
}

/**
 * Method not allowed for other HTTP methods
 */
export async function POST() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PUT() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PATCH() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}