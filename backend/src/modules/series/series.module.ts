import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from '../../models/entities/postgres/series.entity';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Series]), AuthModule],
  controllers: [SeriesController],
  providers: [SeriesService],
})
export class SeriesModule {}
