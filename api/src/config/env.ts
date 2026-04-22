import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV:             z.enum(['development', 'production', 'test']).default('development'),
  PORT:                 z.coerce.number().default(4000),
  HOST:                 z.string().default('0.0.0.0'),
  API_PREFIX:           z.string().default('/api/v1'),

  // Database
  DATABASE_URL:         z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  DATABASE_POOL_MIN:    z.coerce.number().default(2),
  DATABASE_POOL_MAX:    z.coerce.number().default(10),

  // JWT
  JWT_ACCESS_SECRET:    z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET:   z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Redis
  REDIS_HOST:           z.string().default('127.0.0.1'),
  REDIS_PORT:           z.coerce.number().default(6379),
  REDIS_PASSWORD:       z.string().optional(),

  // Email
  EMAIL_HOST:           z.string(),
  EMAIL_PORT:           z.coerce.number().default(587),
  EMAIL_SECURE:         z.coerce.boolean().default(false),
  EMAIL_USER:           z.string().email('EMAIL_USER must be a valid email'),
  EMAIL_PASS:           z.string(),
  EMAIL_FROM:           z.string(),

  // File Upload
  UPLOAD_DIR:           z.string().default('./uploads'),
  MAX_FILE_SIZE_MB:     z.coerce.number().default(10),

  // App URLs
  APP_URL:              z.string().url(),
  FRONTEND_URL:         z.string().url(),
  CORS_ORIGINS:         z.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_MAX:       z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('');
  console.error('❌ Missing or invalid environment variables:');
  console.error('');
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([key, messages]) => {
    console.error(`   ${key}: ${messages?.join(', ')}`);
  });
  console.error('');
  console.error('👉 Check your .env file and fix the above before starting.');
  console.error('');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;