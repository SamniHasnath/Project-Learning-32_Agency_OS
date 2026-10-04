import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Settings shared by the real server (main.ts) and the e2e test app, so tests
 * exercise exactly the same validation and routing.
 */
export function configureApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  // 1 MB allows a base64 logo upload in settings; everything else is far smaller.
  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // …and reject requests that send them (e.g. agencyId, total, status)
      transform: true,
    }),
  );
  return app;
}
