import IORedis from 'ioredis';
import { env } from './env';

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
  retryStrategy: (times: number) => {
    if (times > 5) {
      console.error('❌ Redis: Max retry attempts reached. Giving up.');
      return null;
    }
    const delay = Math.min(times * 500, 3000);
    console.warn(`⚠️  Redis: Retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },
};

// Main Redis connection (for BullMQ)
export const redis = new IORedis(redisConfig);

// Separate connection for BullMQ subscribers (required by BullMQ)
export const redisSub = new IORedis(redisConfig);

redis.on('connect', () => {
  console.log(`✅ Redis connected — ${env.REDIS_HOST}:${env.REDIS_PORT}`);
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('close', () => {
  console.warn('⚠️  Redis connection closed');
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
    console.log('✅ Redis ping successful');
  } catch (error) {
    console.error('❌ Redis connection failed:', (error as Error).message);
    // Non-fatal — app can run without Redis (email queue won't work)
    console.warn('⚠️  App will continue but email/notification queues are disabled');
  }
}