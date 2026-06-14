import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { ReadingSession } from '../../models/entities/postgres/reading-session.entity';
import { StoryLike } from '../../models/entities/postgres/story-like.entity';
import { StoryRating } from '../../models/entities/postgres/story-rating.entity';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import {
  DocumentContent,
  DocumentContentSchema,
} from '../../models/entities/mongo/document-content.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReadingSession, StoryLike, StoryRating, DocumentMeta]),
    MongooseModule.forFeature([
      { name: DocumentContent.name, schema: DocumentContentSchema },
    ]),
    AuthModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
