import { createClient, RedisClientType } from 'redis';

/**
 * Cliente Redis singleton
 */
class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {}

  /**
   * Obter instância singleton
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Conectar ao Redis
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.warn('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Desconectar do Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Verificar se está conectado
   */
  public isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Obter cliente Redis
   */
  private async getClient(): Promise<RedisClientType | null> {
    if (!this.isReady()) {
      await this.connect();
    }
    return this.client;
  }

  /**
   * Definir valor no cache
   * @param key Chave
   * @param value Valor
   * @param ttlSeconds TTL em segundos (opcional)
   */
  public async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Obter valor do cache
   * @param key Chave
   * @returns Valor ou null
   */
  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      if (!client) return null;

      const value = await client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Deletar chave do cache
   * @param key Chave
   */
  public async del(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  /**
   * Verificar se chave existe
   * @param key Chave
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      const result = await client.exists(key);
      return result > 0;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Definir TTL para uma chave
   * @param key Chave
   * @param ttlSeconds TTL em segundos
   */
  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      const result = await client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  /**
   * Incrementar valor numérico
   * @param key Chave
   * @param increment Valor para incrementar (padrão: 1)
   */
  public async incr(key: string, increment: number = 1): Promise<number | null> {
    try {
      const client = await this.getClient();
      if (!client) return null;

      const result = await client.incrBy(key, increment);
      return result;
    } catch (error) {
      console.error('Redis INCR error:', error);
      return null;
    }
  }

  /**
   * Obter múltiplas chaves
   * @param keys Array de chaves
   */
  public async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const client = await this.getClient();
      if (!client) return keys.map(() => null);

      const values = await client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) as T : null);
    } catch (error) {
      console.error('Redis MGET error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Definir múltiplas chaves
   * @param keyValuePairs Pares chave-valor
   */
  public async mset(keyValuePairs: Record<string, any>): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      const serializedPairs: Record<string, string> = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs[key] = JSON.stringify(value);
      }

      await client.mSet(serializedPairs);
      return true;
    } catch (error) {
      console.error('Redis MSET error:', error);
      return false;
    }
  }

  /**
   * Limpar todas as chaves (usar com cuidado!)
   */
  public async flushAll(): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      await client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis FLUSHALL error:', error);
      return false;
    }
  }

  /**
   * Obter informações do servidor Redis
   */
  public async info(): Promise<string | null> {
    try {
      const client = await this.getClient();
      if (!client) return null;

      return await client.info();
    } catch (error) {
      console.error('Redis INFO error:', error);
      return null;
    }
  }
}

// Instância singleton
const redis = RedisService.getInstance();

// Funções de conveniência
export const cache = {
  /**
   * Conectar ao Redis
   */
  connect: () => redis.connect(),
  
  /**
   * Desconectar do Redis
   */
  disconnect: () => redis.disconnect(),
  
  /**
   * Verificar se está pronto
   */
  isReady: () => redis.isReady(),
  
  /**
   * Definir valor no cache
   */
  set: (key: string, value: any, ttlSeconds?: number) => redis.set(key, value, ttlSeconds),
  
  /**
   * Obter valor do cache
   */
  get: <T = any>(key: string) => redis.get<T>(key),
  
  /**
   * Deletar chave
   */
  del: (key: string) => redis.del(key),
  
  /**
   * Verificar se existe
   */
  exists: (key: string) => redis.exists(key),
  
  /**
   * Definir TTL
   */
  expire: (key: string, ttlSeconds: number) => redis.expire(key, ttlSeconds),
  
  /**
   * Incrementar
   */
  incr: (key: string, increment?: number) => redis.incr(key, increment),
  
  /**
   * Obter múltiplas chaves
   */
  mget: <T = any>(keys: string[]) => redis.mget<T>(keys),
  
  /**
   * Definir múltiplas chaves
   */
  mset: (keyValuePairs: Record<string, any>) => redis.mset(keyValuePairs),
  
  /**
   * Limpar tudo
   */
  flushAll: () => redis.flushAll(),
  
  /**
   * Informações do servidor
   */
  info: () => redis.info()
};

export default redis;