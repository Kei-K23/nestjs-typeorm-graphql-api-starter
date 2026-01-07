import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Environment-based CORS configuration
  const configService = app.get(ConfigService);
  const envOriginsRaw = configService.get<string>('CORS_ORIGINS');
  let origins: string[] | boolean = [];

  if (envOriginsRaw) {
    const parsed = envOriginsRaw
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    if (parsed.length === 1) {
      const val = parsed[0].toLowerCase();
      if (val === '*' || val === 'all' || val === 'true') {
        origins = true;
      } else {
        origins = parsed;
      }
    } else if (parsed.length > 1) {
      origins = parsed;
    }
  }

  // Environment-based CORS configuration
  const corsOptions = {
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-signature',
      'x-timestamp',
      'Accept',
      'Origin',
    ],
    credentials: true,
  };

  app.enableCors(corsOptions);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `${configService.get<string>('APP_NAME')} is running on port ${process.env.PORT ?? 3000} (GraphQL Server)`,
  );
}
bootstrap();
