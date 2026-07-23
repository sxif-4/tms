import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  environment: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  // Fallback ticket cap for any day with no park_day_capacities override row.
  parkDefaultDailyCapacity: parseInt(
    process.env.PARK_DEFAULT_DAILY_CAPACITY ?? '2000',
    10,
  ),
}));

export type AppConfig = ReturnType<typeof appConfig>;
