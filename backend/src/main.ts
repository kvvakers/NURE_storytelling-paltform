import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  config();

  const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
  mkdirSync(uploadsDir, { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'covers'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    bodyParser: true,
  });

  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const port = process.env.BACKEND_PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
