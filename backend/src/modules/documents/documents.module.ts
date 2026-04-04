import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import {
  DocumentContent,
  DocumentContentSchema,
} from '../../models/entities/mongo/document-content.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentMeta]),
    MongooseModule.forFeature([
      { name: DocumentContent.name, schema: DocumentContentSchema },
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
