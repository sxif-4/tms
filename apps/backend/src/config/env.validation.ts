import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4000),

  DATABASE_PATH: Joi.string().default('./data/dev.db'),

  CORS_ORIGIN: Joi.string().uri().default('http://localhost:3000'),

  // Ticket cap applied to days with no park_day_capacities override row.
  PARK_DEFAULT_DAILY_CAPACITY: Joi.number().integer().min(1).default(2000),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('booking-system'),
  JWT_AUDIENCE: Joi.string().default('booking-system-clients'),

  // Used only by the database seed script.
  ADMIN_EMAIL: Joi.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: Joi.string().min(8).default('ChangeMe123!'),
});
