import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getUserSeries(@Request() req: any) {
    return this.seriesService.getUserSeries(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createSeries(@Body() dto: CreateSeriesDto, @Request() req: any) {
    return this.seriesService.createSeries(dto, req.user.userId);
  }
}
