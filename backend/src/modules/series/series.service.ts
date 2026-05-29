import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../../models/entities/postgres/series.entity';
import { CreateSeriesDto } from './dto/create-series.dto';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepository: Repository<Series>,
  ) {}

  getUserSeries(ownerId: number): Promise<Series[]> {
    return this.seriesRepository.find({ where: { ownerId } });
  }

  createSeries(dto: CreateSeriesDto, ownerId: number): Promise<Series> {
    const series = this.seriesRepository.create({ title: dto.title, ownerId });
    return this.seriesRepository.save(series);
  }
}
