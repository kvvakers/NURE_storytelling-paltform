import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';

async function bootstrap() {
  config();

  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const port = process.env.BACKEND_PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
