import IORedis, { type RedisOptions } from 'ioredis';
import { env } from './env.js';

const retryStrategy = (times: number): number | null => {
  if (times > 5) {
    console.error('❌ Redis: Max retry attempts reached. Giving up.');
    return null;
  }
  const delay = Math.min(times * 500, 3000);
  console.warn(`⚠️  Redis: Retrying connection in ${delay}ms (attempt ${times})`);
  return delay;
};

const baseConfig: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy,
};

function createClient(): IORedis {
  if (env.REDIS_URL) {
    return new IORedis(env.REDIS_URL, baseConfig);
  }
  return new IORedis({
    host:     env.REDIS_HOST,
    port:     env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    ...baseConfig,
  });
}

// Main Redis connection
export const redis = createClient();

// Separate subscriber connection (required by BullMQ)
export const redisSub = createClient();

redis.on('connect', () => console.log(`✅ Redis connected`));
redis.on('error',   (err) => console.error('❌ Redis error:', err.message));
redis.on('close',   () => console.warn('⚠️  Redis connection closed'));

export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
    console.log('✅ Redis ping successful');
  } catch (error) {
    console.error('❌ Redis connection failed:', (error as Error).message);
    console.warn('⚠️  App will continue but email/notification queues are disabled');
  }
}