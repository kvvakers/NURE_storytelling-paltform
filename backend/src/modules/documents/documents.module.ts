import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import { User } from '../../models/entities/postgres/user.entity';
import { Series } from '../../models/entities/postgres/series.entity';
import { StoryLike } from '../../models/entities/postgres/story-like.entity';
import { StoryRating } from '../../models/entities/postgres/story-rating.entity';
import { AuthModule } from '../auth/auth.module';
import {
  DocumentContent,
  DocumentContentSchema,
} from '../../models/entities/mongo/document-content.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CoAuthorsModule } from '../co-authors/co-authors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentMeta, User, Series, StoryLike, StoryRating]),
    MongooseModule.forFeature([
      { name: DocumentContent.name, schema: DocumentContentSchema },
    ]),
    AuthModule,
    NotificationsModule,
    SubscriptionsModule,
    CoAuthorsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
