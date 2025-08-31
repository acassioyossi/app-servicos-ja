import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options: Options) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<{
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
      }>((resolve) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        const reset = Date.now() + (options.interval || 60000);

        tokenCache.set(token, [currentUsage + 1]);

        return resolve({
          success: !isRateLimited,
          limit,
          remaining: isRateLimited ? 0 : limit - currentUsage,
          reset,
        });
      }),
  };
}

/**
 * Rate limiter específico para tentativas de login
 */
export const loginRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutos
  uniqueTokenPerInterval: 500,
});

/**
 * Rate limiter geral para APIs
 */
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 1000,
});

/**
 * Rate limiter para operações sensíveis
 */
export const sensitiveRateLimit = rateLimit({
  interval: 60 * 60 * 1000, // 1 hora
  uniqueTokenPerInterval: 100,
});