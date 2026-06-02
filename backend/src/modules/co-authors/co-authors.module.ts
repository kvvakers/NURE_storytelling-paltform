import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoAuthorsController } from './co-authors.controller';
import { CoAuthorsService } from './co-authors.service';
import { CoAuthorInvitation } from '../../models/entities/postgres/co-author-invitation.entity';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import { User } from '../../models/entities/postgres/user.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CoAuthorInvitation, DocumentMeta, User]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [CoAuthorsController],
  providers: [CoAuthorsService],
  exports: [CoAuthorsService],
})
export class CoAuthorsModule {}
