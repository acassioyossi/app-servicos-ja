import { Redis } from 'ioredis';
import { LRUCache } from 'lru-cache';

// Configuração do Redis (se disponível)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

// Cache em memória otimizado com múltiplas camadas
const memoryCache = new LRUCache<string, any>({
  max: 2000, // Aumentado para melhor performance
  ttl: 1000 * 60 * 15, // 15 minutos
  updateAgeOnGet: true, // Atualizar idade no acesso
  allowStale: true, // Permitir dados expirados temporariamente
});

// Cache de alta frequência para dados críticos
const hotCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutos
  updateAgeOnGet: true,
});

// Métricas de performance do cache
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  avgResponseTime: number;
}

const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  avgResponseTime: 0
};

const responseTimes: number[] = [];

// Interface de cache otimizada
const cache = {
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      let value: T | null = null;
      
      // Tentar cache em memória primeiro
      value = memoryCache.get(key) || null;
      if (value) {
        metrics.hits++;
        updateResponseTime(startTime);
        return value;
      }
      
      // Tentar Redis
      if (redis) {
        const redisValue = await redis.get(key);
        if (redisValue) {
          value = JSON.parse(redisValue);
          // Sincronizar com cache em memória
          memoryCache.set(key, value);
          metrics.hits++;
          updateResponseTime(startTime);
          return value;
        }
      }
      
      metrics.misses++;
      updateResponseTime(startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      metrics.errors++;
      updateResponseTime(startTime);
      return memoryCache.get(key) || null;
    }
  },

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const serializedValue = JSON.stringify(value);
      
      // Definir no cache em memória
      if (ttl) {
        memoryCache.set(key, value, { ttl: ttl * 1000 });
      } else {
        memoryCache.set(key, value);
      }
      
      // Definir no Redis
      if (redis) {
        if (ttl) {
          await redis.setex(key, ttl, serializedValue);
        } else {
          await redis.set(key, serializedValue);
        }
      }
      
      metrics.sets++;
      updateResponseTime(startTime);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      metrics.errors++;
      
      // Pelo menos salvar no cache em memória
      try {
        if (ttl) {
          memoryCache.set(key, value, { ttl: ttl * 1000 });
        } else {
          memoryCache.set(key, value);
        }
      } catch (memError) {
        console.error('Memory cache fallback error:', memError);
      }
      
      updateResponseTime(startTime);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      memoryCache.delete(key);
      
      if (redis) {
        await redis.del(key);
      }
      
      metrics.deletes++;
      updateResponseTime(startTime);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      metrics.errors++;
      
      // Pelo menos remover do cache em memória
      memoryCache.delete(key);
      
      updateResponseTime(startTime);
      return false;
    }
  },

  async incr(key: string, value: number = 1): Promise<number | null> {
    try {
      if (redis) {
        return await redis.incrby(key, value);
      }
      
      const current = memoryCache.get(key) || 0;
      const newValue = current + value;
      memoryCache.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error('Cache incr error:', error);
      return null;
    }
  },

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (redis) {
        await redis.expire(key, ttl);
      }
      
      const value = memoryCache.get(key);
      if (value !== undefined) {
        memoryCache.set(key, value, { ttl: ttl * 1000 });
      }
      
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  },

  isReady(): boolean {
    return redis?.status === 'ready' || true; // Memory cache sempre disponível
  },

  async connect(): Promise<void> {
    if (redis && redis.status !== 'ready') {
      await redis.connect();
    }
  },

  async info(): Promise<string | null> {
    try {
      if (redis) {
        return await redis.info();
      }
      return `Memory Cache - Size: ${memoryCache.size}`;
    } catch (error) {
      console.error('Cache info error:', error);
      return null;
    }
  },

  async flushAll(): Promise<boolean> {
    try {
      memoryCache.clear();
      hotCache.clear();
      
      if (redis) {
        await redis.flushall();
      }
      
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
};

// Função auxiliar para atualizar métricas
function updateResponseTime(startTime: number): void {
  const responseTime = performance.now() - startTime;
  responseTimes.push(responseTime);
  
  // Manter apenas os últimos 1000 tempos de resposta
  if (responseTimes.length > 1000) {
    responseTimes.shift();
  }
  
  // Calcular média
  metrics.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
}

/**
 * Prefixos para diferentes tipos de cache
 */
const CACHE_PREFIXES = {
  USER: 'user:',
  SESSION: 'session:',
  RATE_LIMIT: 'rate_limit:',
  API_RESPONSE: 'api:',
  SEARCH: 'search:',
  NOTIFICATION: 'notification:',
  TEMP_DATA: 'temp:',
  ANALYTICS: 'analytics:'
} as const;

/**
 * TTL padrão para diferentes tipos de cache (em segundos)
 */
const DEFAULT_TTL = {
  USER_DATA: 300, // 5 minutos
  SESSION: 3600, // 1 hora
  RATE_LIMIT: 900, // 15 minutos
  API_RESPONSE: 600, // 10 minutos
  SEARCH_RESULTS: 1800, // 30 minutos
  NOTIFICATION: 86400, // 24 horas
  TEMP_DATA: 300, // 5 minutos
  ANALYTICS: 3600 // 1 hora
} as const;

/**
 * Serviço de cache da aplicação
 */
export class CacheService {
  /**
   * Gerar chave de cache com prefixo
   * @param prefix Prefixo
   * @param key Chave
   * @returns Chave completa
   */
  private static generateKey(prefix: string, key: string): string {
    return `${prefix}${key}`;
  }

  /**
   * Cache de dados do usuário
   */
  static user = {
    /**
     * Cachear dados do usuário
     * @param userId ID do usuário
     * @param userData Dados do usuário
     * @param ttl TTL personalizado
     */
    set: async (userId: string, userData: any, ttl: number = DEFAULT_TTL.USER_DATA): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.USER, userId);
      return await cache.set(key, userData, ttl);
    },

    /**
     * Obter dados do usuário do cache
     * @param userId ID do usuário
     */
    get: async <T = any>(userId: string): Promise<T | null> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.USER, userId);
      return await cache.get<T>(key);
    },

    /**
     * Remover dados do usuário do cache
     * @param userId ID do usuário
     */
    del: async (userId: string): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.USER, userId);
      return await cache.del(key);
    }
  };

  /**
   * Cache de sessões
   */
  static session = {
    /**
     * Cachear sessão
     * @param sessionId ID da sessão
     * @param sessionData Dados da sessão
     * @param ttl TTL personalizado
     */
    set: async (sessionId: string, sessionData: any, ttl: number = DEFAULT_TTL.SESSION): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.SESSION, sessionId);
      return await cache.set(key, sessionData, ttl);
    },

    /**
     * Obter sessão do cache
     * @param sessionId ID da sessão
     */
    get: async <T = any>(sessionId: string): Promise<T | null> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.SESSION, sessionId);
      return await cache.get<T>(key);
    },

    /**
     * Remover sessão do cache
     * @param sessionId ID da sessão
     */
    del: async (sessionId: string): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.SESSION, sessionId);
      return await cache.del(key);
    },

    /**
     * Renovar TTL da sessão
     * @param sessionId ID da sessão
     * @param ttl Novo TTL
     */
    refresh: async (sessionId: string, ttl: number = DEFAULT_TTL.SESSION): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.SESSION, sessionId);
      return await cache.expire(key, ttl);
    }
  };

  /**
   * Cache para rate limiting
   */
  static rateLimit = {
    /**
     * Incrementar contador de rate limit
     * @param identifier Identificador (IP, user ID, etc.)
     * @param window Janela de tempo em segundos
     * @returns Número atual de tentativas
     */
    increment: async (identifier: string, window: number = DEFAULT_TTL.RATE_LIMIT): Promise<number | null> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.RATE_LIMIT, identifier);
      const current = await cache.incr(key, 1);
      
      if (current === 1) {
        // Primeira tentativa, definir TTL
        await cache.expire(key, window);
      }
      
      return current;
    },

    /**
     * Obter contador atual
     * @param identifier Identificador
     */
    get: async (identifier: string): Promise<number> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.RATE_LIMIT, identifier);
      const count = await cache.get<number>(key);
      return count || 0;
    },

    /**
     * Resetar contador
     * @param identifier Identificador
     */
    reset: async (identifier: string): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.RATE_LIMIT, identifier);
      return await cache.del(key);
    }
  };

  /**
   * Cache de respostas de API
   */
  static apiResponse = {
    /**
     * Cachear resposta de API
     * @param endpoint Endpoint da API
     * @param params Parâmetros da requisição
     * @param response Resposta
     * @param ttl TTL personalizado
     */
    set: async (endpoint: string, params: any, response: any, ttl: number = DEFAULT_TTL.API_RESPONSE): Promise<boolean> => {
      const paramHash = Buffer.from(JSON.stringify(params)).toString('base64');
      const key = CacheService.generateKey(CACHE_PREFIXES.API_RESPONSE, `${endpoint}:${paramHash}`);
      return await cache.set(key, response, ttl);
    },

    /**
     * Obter resposta de API do cache
     * @param endpoint Endpoint da API
     * @param params Parâmetros da requisição
     */
    get: async <T = any>(endpoint: string, params: any): Promise<T | null> => {
      const paramHash = Buffer.from(JSON.stringify(params)).toString('base64');
      const key = CacheService.generateKey(CACHE_PREFIXES.API_RESPONSE, `${endpoint}:${paramHash}`);
      return await cache.get<T>(key);
    },

    /**
     * Invalidar cache de endpoint
     * @param endpoint Endpoint da API
     * @param params Parâmetros específicos (opcional)
     */
    invalidate: async (endpoint: string, params?: any): Promise<boolean> => {
      if (params) {
        const paramHash = Buffer.from(JSON.stringify(params)).toString('base64');
        const key = CacheService.generateKey(CACHE_PREFIXES.API_RESPONSE, `${endpoint}:${paramHash}`);
        return await cache.del(key);
      }
      
      // TODO: Implementar invalidação por padrão de chave
      console.warn('Invalidação por padrão não implementada ainda');
      return false;
    }
  };

  /**
   * Cache de resultados de busca
   */
  static search = {
    /**
     * Cachear resultados de busca
     * @param query Query de busca
     * @param filters Filtros aplicados
     * @param results Resultados
     * @param ttl TTL personalizado
     */
    set: async (query: string, filters: any, results: any, ttl: number = DEFAULT_TTL.SEARCH_RESULTS): Promise<boolean> => {
      const searchHash = Buffer.from(JSON.stringify({ query, filters })).toString('base64');
      const key = CacheService.generateKey(CACHE_PREFIXES.SEARCH, searchHash);
      return await cache.set(key, results, ttl);
    },

    /**
     * Obter resultados de busca do cache
     * @param query Query de busca
     * @param filters Filtros aplicados
     */
    get: async <T = any>(query: string, filters: any): Promise<T | null> => {
      const searchHash = Buffer.from(JSON.stringify({ query, filters })).toString('base64');
      const key = CacheService.generateKey(CACHE_PREFIXES.SEARCH, searchHash);
      return await cache.get<T>(key);
    }
  };

  /**
   * Cache de notificações
   */
  static notification = {
    /**
     * Cachear notificações do usuário
     * @param userId ID do usuário
     * @param notifications Notificações
     * @param ttl TTL personalizado
     */
    set: async (userId: string, notifications: any[], ttl: number = DEFAULT_TTL.NOTIFICATION): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.NOTIFICATION, userId);
      return await cache.set(key, notifications, ttl);
    },

    /**
     * Obter notificações do usuário
     * @param userId ID do usuário
     */
    get: async (userId: string): Promise<any[] | null> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.NOTIFICATION, userId);
      return await cache.get<any[]>(key);
    },

    /**
     * Adicionar notificação ao cache
     * @param userId ID do usuário
     * @param notification Nova notificação
     */
    add: async (userId: string, notification: any): Promise<boolean> => {
      const existing = await CacheService.notification.get(userId) || [];
      existing.unshift(notification); // Adicionar no início
      
      // Manter apenas as 50 mais recentes
      if (existing.length > 50) {
        existing.splice(50);
      }
      
      return await CacheService.notification.set(userId, existing);
    },

    /**
     * Limpar notificações do usuário
     * @param userId ID do usuário
     */
    clear: async (userId: string): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.NOTIFICATION, userId);
      return await cache.del(key);
    }
  };

  /**
   * Cache temporário
   */
  static temp = {
    /**
     * Armazenar dados temporários
     * @param key Chave
     * @param data Dados
     * @param ttl TTL personalizado
     */
    set: async (key: string, data: any, ttl: number = DEFAULT_TTL.TEMP_DATA): Promise<boolean> => {
      const cacheKey = CacheService.generateKey(CACHE_PREFIXES.TEMP_DATA, key);
      return await cache.set(cacheKey, data, ttl);
    },

    /**
     * Obter dados temporários
     * @param key Chave
     */
    get: async <T = any>(key: string): Promise<T | null> => {
      const cacheKey = CacheService.generateKey(CACHE_PREFIXES.TEMP_DATA, key);
      return await cache.get<T>(cacheKey);
    },

    /**
     * Remover dados temporários
     * @param key Chave
     */
    del: async (key: string): Promise<boolean> => {
      const cacheKey = CacheService.generateKey(CACHE_PREFIXES.TEMP_DATA, key);
      return await cache.del(cacheKey);
    }
  };

  /**
   * Cache de analytics
   */
  static analytics = {
    /**
     * Incrementar contador de analytics
     * @param metric Nome da métrica
     * @param value Valor para incrementar
     */
    increment: async (metric: string, value: number = 1): Promise<number | null> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.ANALYTICS, metric);
      return await cache.incr(key, value);
    },

    /**
     * Obter valor da métrica
     * @param metric Nome da métrica
     */
    get: async (metric: string): Promise<number> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.ANALYTICS, metric);
      const value = await cache.get<number>(key);
      return value || 0;
    },

    /**
     * Definir valor da métrica
     * @param metric Nome da métrica
     * @param value Valor
     * @param ttl TTL personalizado
     */
    set: async (metric: string, value: number, ttl: number = DEFAULT_TTL.ANALYTICS): Promise<boolean> => {
      const key = CacheService.generateKey(CACHE_PREFIXES.ANALYTICS, metric);
      return await cache.set(key, value, ttl);
    }
  };

  /**
   * Obter métricas de performance
   */
  static getMetrics(): CacheMetrics & {
    hitRate: number;
    memoryUsage: { hot: number; main: number };
    redisConnected: boolean;
  } {
    const total = metrics.hits + metrics.misses;
    const hitRate = total > 0 ? (metrics.hits / total) * 100 : 0;
    
    return {
      ...metrics,
      hitRate,
      memoryUsage: {
        hot: hotCache.size,
        main: memoryCache.size
      },
      redisConnected: redis?.status === 'ready'
    };
  }

  /**
   * Pré-aquecer cache com dados críticos
   */
  static async warmup(data: Array<{ key: string; value: any; ttl?: number; hot?: boolean }>): Promise<void> {
    const promises = data.map(async ({ key, value, ttl, hot }) => {
      try {
        if (hot) {
          const hotTtl = ttl ? Math.min(ttl, 300) : 300;
          hotCache.set(key, value, { ttl: hotTtl * 1000 });
        }
        await cache.set(key, value, ttl);
      } catch (error) {
        console.error(`Warmup failed for key ${key}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }

  /**
   * Cache com fallback para função
   */
  static async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T> | T,
    ttl?: number,
    useHotCache = false
  ): Promise<T> {
    let cached: T | null = null;
    
    if (useHotCache) {
      cached = hotCache.get(key) || null;
      if (cached !== null) {
        return cached;
      }
    }
    
    cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const value = await fallbackFn();
    
    if (useHotCache) {
      const hotTtl = ttl ? Math.min(ttl, 300) : 300;
      hotCache.set(key, value, { ttl: hotTtl * 1000 });
    }
    
    await cache.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidar cache por padrão
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Invalidar cache em memória
      const keysToDelete: string[] = [];
      
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of hotCache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        memoryCache.delete(key);
        hotCache.delete(key);
      });
      
      // Invalidar no Redis
      if (redis) {
        const keys = await redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Pattern invalidation error:', error);
      metrics.errors++;
    }
  }

  /**
   * Utilitários gerais
   */
  static utils = {
    /**
     * Verificar se o Redis está disponível
     */
    isAvailable: (): boolean => {
      return cache.isReady();
    },

    /**
     * Conectar ao Redis
     */
    connect: async (): Promise<void> => {
      await cache.connect();
    },

    /**
     * Obter informações do Redis
     */
    info: async (): Promise<string | null> => {
      return await cache.info();
    },

    /**
     * Limpar todo o cache (usar com cuidado!)
     */
    flushAll: async (): Promise<boolean> => {
      console.warn('Limpando todo o cache Redis!');
      const result = await cache.flushAll();
      
      // Resetar métricas
      metrics.hits = 0;
      metrics.misses = 0;
      metrics.sets = 0;
      metrics.deletes = 0;
      metrics.errors = 0;
      metrics.avgResponseTime = 0;
      responseTimes.length = 0;
      
      return result;
    },

    /**
     * Obter estatísticas detalhadas
     */
    getStats: () => {
      return {
        metrics: CacheService.getMetrics(),
        cacheInfo: {
          memoryCache: {
            size: memoryCache.size,
            maxSize: memoryCache.max,
            calculatedSize: memoryCache.calculatedSize
          },
          hotCache: {
            size: hotCache.size,
            maxSize: hotCache.max,
            calculatedSize: hotCache.calculatedSize
          },
          redis: {
            connected: redis?.status === 'ready',
            status: redis?.status || 'not configured'
          }
        }
      };
    }
  };
}

export default CacheService;