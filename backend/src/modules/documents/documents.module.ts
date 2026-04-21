import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import { User } from '../../models/entities/postgres/user.entity';
import { AuthModule } from '../auth/auth.module';
import {
  DocumentContent,
  DocumentContentSchema,
} from '../../models/entities/mongo/document-content.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentMeta, User]),
    MongooseModule.forFeature([
      { name: DocumentContent.name, schema: DocumentContentSchema },
    ]),
    AuthModule,
    NotificationsModule,
    SubscriptionsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
