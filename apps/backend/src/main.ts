import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import {
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
} from './shared/images/image-storage.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Uploaded images are served cross-origin to the SSR app and the browser,
  // so the default same-origin resource policy would block them.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>('app.corsOrigin'),
    credentials: true,
  });
  // Mounted before the global prefix so uploads live at /uploads, not /api.
  app.useStaticAssets(UPLOADS_DIR, { prefix: `${UPLOADS_URL_PREFIX}/` });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = config.get<number>('app.port') ?? 4000;
  await app.listen(port);
  console.log(`🚀 Backend listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
