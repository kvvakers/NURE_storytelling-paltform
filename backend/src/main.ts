import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { join } from 'path';
import { mkdirSync } from 'fs';
import * as http from 'http';
import { WebSocketServer } from 'ws';

async function bootstrap() {
  config();

  const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
  mkdirSync(uploadsDir, { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'covers'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
  });

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const port = process.env.BACKEND_PORT ?? 3000;
  await app.listen(port);

  // Yjs WebSocket server on /yjs/* — handles CRDT collaborative editing
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const { setupWSConnection } = require('y-websocket/bin/utils');
  const httpServer: http.Server = app.getHttpServer();
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req: http.IncomingMessage, socket, head: Buffer) => {
    if (new URL(req.url!, 'http://localhost').pathname.startsWith('/yjs')) {
      wss.handleUpgrade(req, socket as import('stream').Duplex, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws, req: http.IncomingMessage) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    setupWSConnection(ws, req, { gc: true });
  });
}

bootstrap();
