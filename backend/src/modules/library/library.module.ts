import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryCategory } from '../../models/entities/postgres/library-category.entity';
import { LibraryItem } from '../../models/entities/postgres/library-item.entity';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import { StoryLike } from '../../models/entities/postgres/story-like.entity';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LibraryCategory, LibraryItem, DocumentMeta, StoryLike]),
    AuthModule,
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
