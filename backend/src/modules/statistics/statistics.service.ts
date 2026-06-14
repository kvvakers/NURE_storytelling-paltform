import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { ReadingSession } from '../../models/entities/postgres/reading-session.entity';
import { StoryLike } from '../../models/entities/postgres/story-like.entity';
import { StoryRating } from '../../models/entities/postgres/story-rating.entity';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import {
  DocumentContent,
  DocumentContentDocument,
} from '../../models/entities/mongo/document-content.schema';

export type StatsPeriod = 'day' | 'week' | 'month';

function getPeriodStart(period: StatsPeriod): Date {
  const now = new Date();
  if (period === 'day') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function buildTimeline(period: StatsPeriod): { date: string; count: number }[] {
  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
  const timeline: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    timeline.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return timeline;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(ReadingSession)
    private readonly sessionRepo: Repository<ReadingSession>,
    @InjectRepository(StoryLike)
    private readonly likeRepo: Repository<StoryLike>,
    @InjectRepository(StoryRating)
    private readonly ratingRepo: Repository<StoryRating>,
    @InjectRepository(DocumentMeta)
    private readonly storyRepo: Repository<DocumentMeta>,
    @InjectModel(DocumentContent.name)
    private readonly contentModel: Model<DocumentContentDocument>,
  ) {}

  async recordSession(
    storyId: number,
    chapterIndex: number,
    durationSeconds: number,
    userId: number | null,
  ) {
    if (durationSeconds < 1) return;
    const session = this.sessionRepo.create({ storyId, chapterIndex, durationSeconds, userId });
    await this.sessionRepo.save(session);
  }

  async getStoryStats(storyId: number, requestUserId: number, period: StatsPeriod) {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');

    const isAuthor =
      story.ownerId === requestUserId ||
      (story.coAuthorIds ?? []).includes(requestUserId);
    if (!isAuthor) throw new ForbiddenException('Access denied');

    const since = getPeriodStart(period);

    const [
      readingTimePerChapter,
      likesTimeline,
      ratingsTimeline,
      commentStats,
      sessionsByDayOfWeek,
      sessionsByHour,
      chapterRetention,
      uniqueReadersTimeline,
      readingSpeed,
    ] = await Promise.all([
      this.getReadingTimePerChapter(storyId, since),
      this.getLikesTimeline(storyId, since, period),
      this.getRatingsTimeline(storyId, since, period),
      this.getCommentStats(storyId, since),
      this.getSessionsByDayOfWeek(storyId, since),
      this.getSessionsByHour(storyId, since),
      this.getChapterRetention(storyId, since),
      this.getUniqueReadersTimeline(storyId, since, period),
      this.getReadingSpeed(storyId, since),
    ]);

    return {
      period,
      storyId,
      readingTimePerChapter,
      likesTimeline,
      ratingsTimeline,
      commentsPerChapter: commentStats.perChapter,
      storyCommentCount: commentStats.storyTotal,
      sessionsByDayOfWeek,
      sessionsByHour,
      chapterRetention,
      uniqueReadersTimeline,
      readingSpeed,
    };
  }

  private async getReadingTimePerChapter(storyId: number, since: Date) {
    const rows = await this.sessionRepo
      .createQueryBuilder('s')
      .select('s.chapterIndex', 'chapterIndex')
      .addSelect('AVG(s.durationSeconds)', 'totalSeconds')
      .where('s.storyId = :storyId', { storyId })
      .andWhere('s.createdAt >= :since', { since })
      .groupBy('s.chapterIndex')
      .orderBy('s.chapterIndex', 'ASC')
      .getRawMany<{ chapterIndex: string; totalSeconds: string }>();

    return rows.map((r) => ({
      chapterIndex: Number(r.chapterIndex),
      totalSeconds: Number(r.totalSeconds),
    }));
  }

  private async getLikesTimeline(storyId: number, since: Date, period: StatsPeriod) {
    const timeline = buildTimeline(period);
    const rows = await this.likeRepo
      .createQueryBuilder('l')
      .select("TO_CHAR(l.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(l.id)', 'count')
      .where('l.storyId = :storyId', { storyId })
      .andWhere('l.createdAt >= :since', { since })
      .groupBy("TO_CHAR(l.createdAt, 'YYYY-MM-DD')")
      .getRawMany<{ date: string; count: string }>();

    const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
    return timeline.map((t) => ({ date: t.date, count: map.get(t.date) ?? 0 }));
  }

  private async getRatingsTimeline(storyId: number, since: Date, period: StatsPeriod) {
    const timeline = buildTimeline(period);
    const rows = await this.ratingRepo
      .createQueryBuilder('r')
      .select("TO_CHAR(r.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.storyId = :storyId', { storyId })
      .andWhere('r.createdAt >= :since', { since })
      .groupBy("TO_CHAR(r.createdAt, 'YYYY-MM-DD')")
      .getRawMany<{ date: string; count: string }>();

    const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
    return timeline.map((t) => ({ date: t.date, count: map.get(t.date) ?? 0 }));
  }

  private async getSessionsByDayOfWeek(storyId: number, since: Date) {
    const DOW_LABELS: Record<number, string> = {
      1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 0: 'Нд',
    };
    const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

    const rows = await this.sessionRepo
      .createQueryBuilder('s')
      .select('EXTRACT(DOW FROM s."createdAt")::int', 'dow')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.storyId = :storyId', { storyId })
      .andWhere('s.createdAt >= :since', { since })
      .groupBy('EXTRACT(DOW FROM s."createdAt")::int')
      .getRawMany<{ dow: number; count: string }>();

    const map = new Map(rows.map((r) => [Number(r.dow), Number(r.count)]));
    return DOW_ORDER.map((d) => ({ day: DOW_LABELS[d], count: map.get(d) ?? 0 }));
  }

  private async getSessionsByHour(storyId: number, since: Date) {
    const rows = await this.sessionRepo
      .createQueryBuilder('s')
      .select('EXTRACT(HOUR FROM s."createdAt")::int', 'hour')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.storyId = :storyId', { storyId })
      .andWhere('s.createdAt >= :since', { since })
      .groupBy('EXTRACT(HOUR FROM s."createdAt")::int')
      .orderBy('EXTRACT(HOUR FROM s."createdAt")::int', 'ASC')
      .getRawMany<{ hour: number; count: string }>();

    const map = new Map(rows.map((r) => [Number(r.hour), Number(r.count)]));
    return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: map.get(h) ?? 0 }));
  }

  private async getChapterRetention(storyId: number, since: Date) {
    const rows = await this.sessionRepo
      .createQueryBuilder('s')
      .select('s.chapterIndex', 'chapterIndex')
      .addSelect('COUNT(DISTINCT s.userId)', 'readers')
      .where('s.storyId = :storyId', { storyId })
      .andWhere('s.createdAt >= :since', { since })
      .andWhere('s.userId IS NOT NULL')
      .groupBy('s.chapterIndex')
      .orderBy('s.chapterIndex', 'ASC')
      .getRawMany<{ chapterIndex: string; readers: string }>();

    if (rows.length === 0) return [];

    const firstRow = rows.find((r) => Number(r.chapterIndex) === 0);
    const baseReaders = firstRow ? Number(firstRow.readers) : 0;
    if (baseReaders === 0) return [];

    return rows.map((r) => {
      const readers = Number(r.readers);
      return {
        chapterIndex: Number(r.chapterIndex),
        readers,
        percent: Math.round((readers / baseReaders) * 100),
      };
    });
  }

  private async getUniqueReadersTimeline(storyId: number, since: Date, period: StatsPeriod) {
    const timeline = buildTimeline(period);
    const rows = await this.sessionRepo
      .createQueryBuilder('s')
      .select("TO_CHAR(s.\"createdAt\", 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(DISTINCT s.userId)', 'count')
      .where('s.storyId = :storyId', { storyId })
      .andWhere('s.createdAt >= :since', { since })
      .andWhere('s.userId IS NOT NULL')
      .groupBy("TO_CHAR(s.\"createdAt\", 'YYYY-MM-DD')")
      .getRawMany<{ date: string; count: string }>();

    const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
    return timeline.map((t) => ({ date: t.date, count: map.get(t.date) ?? 0 }));
  }

  private async getReadingSpeed(storyId: number, since: Date) {
    const rows = await this.sessionRepo
      .createQueryBuilder('s')
      .select('s.chapterIndex', 'chapterIndex')
      .addSelect('AVG(s.durationSeconds)', 'avgSeconds')
      .where('s.storyId = :storyId', { storyId })
      .andWhere('s.createdAt >= :since', { since })
      .groupBy('s.chapterIndex')
      .orderBy('s.chapterIndex', 'ASC')
      .getRawMany<{ chapterIndex: string; avgSeconds: string }>();

    if (rows.length === 0) return [];

    const content = await this.contentModel.findOne({ documentId: storyId });
    if (!content || !content.chapters) return [];

    const result: { chapterIndex: number; charsPerMinute: number }[] = [];
    for (const row of rows) {
      const idx = Number(row.chapterIndex);
      const avgSeconds = Number(row.avgSeconds);
      if (avgSeconds <= 0) continue;

      const chapter = content.chapters[idx];
      if (!chapter || !chapter.content) continue;

      const textLength = chapter.content.replace(/<[^>]*>/g, '').length;
      if (textLength === 0) continue;

      const charsPerMinute = Math.round((textLength / avgSeconds) * 60);
      result.push({ chapterIndex: idx, charsPerMinute });
    }
    return result;
  }

  private async getCommentStats(storyId: number, since: Date) {
    const content = await this.contentModel.findOne({ documentId: storyId });
    if (!content) return { perChapter: [], storyTotal: 0 };

    const perChapter = (content.chapters || []).map((ch, idx) => {
      const count = (ch.comments || []).filter(
        (c) => new Date(c.createdAt) >= since,
      ).length;
      return { chapterIndex: idx, count };
    });

    const storyTotal = (content.storyComments || []).filter(
      (c) => new Date(c.createdAt) >= since,
    ).length;

    return { perChapter, storyTotal };
  }
}
