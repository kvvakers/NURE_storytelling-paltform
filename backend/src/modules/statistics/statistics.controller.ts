import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService, StatsPeriod } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Post('reading-session')
  @UseGuards(OptionalJwtAuthGuard)
  recordSession(
    @Body() body: { storyId: number; chapterIndex: number; durationSeconds: number },
    @Request() req: any,
  ) {
    const userId: number | null = req.user?.userId ?? null;
    return this.statisticsService.recordSession(
      body.storyId,
      body.chapterIndex,
      body.durationSeconds,
      userId,
    );
  }

  @Get('stories/:storyId')
  @UseGuards(JwtAuthGuard)
  getStoryStats(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Query('period') period: string,
    @Request() req: any,
  ) {
    const validPeriod: StatsPeriod =
      period === 'day' || period === 'week' || period === 'month' ? period : 'week';
    return this.statisticsService.getStoryStats(storyId, req.user.userId, validPeriod);
  }
}
