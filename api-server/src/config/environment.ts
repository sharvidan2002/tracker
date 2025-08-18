import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // Database URLs
  DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/expense_tracker'),
  MONGODB_URL: z.string().default('mongodb://localhost:27017/expense_tracker'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT secrets
  JWT_SECRET: z.string().default('your-super-secret-jwt-key-change-in-production'),
  JWT_REFRESH_SECRET: z.string().default('your-super-secret-refresh-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Client URL for CORS
  CLIENT_URL: z.string().default('http://localhost:3000'),

  // ML Service URL
  ML_SERVICE_URL: z.string().default('http://localhost:5000'),

  // External API keys
  GEMINI_API_KEY: z.string().optional(),

  // File upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

const env = envSchema.parse(process.env)

export const config = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL,
  MONGODB_URL: env.MONGODB_URL,
  REDIS_URL: env.REDIS_URL,
  JWT_SECRET: env.JWT_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN,
  CLIENT_URL: env.CLIENT_URL,
  ML_SERVICE_URL: env.ML_SERVICE_URL,
  GEMINI_API_KEY: env.GEMINI_API_KEY,
  UPLOAD_DIR: env.UPLOAD_DIR,
  MAX_FILE_SIZE: env.MAX_FILE_SIZE,
  RATE_LIMIT_WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: env.RATE_LIMIT_MAX_REQUESTS,
  BCRYPT_ROUNDS: env.BCRYPT_ROUNDS,
  LOG_LEVEL: env.LOG_LEVEL,
} as const

export type Config = typeof config