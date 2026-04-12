import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import {
  CreateStoryDto,
  CreateCommentDto,
  CreateChapterDto,
} from './dto/create-story.dto';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import { User } from '../../models/entities/postgres/user.entity';
import {
  ChapterComment,
  CommentReply,
  DocumentContent,
  DocumentContentDocument,
} from '../../models/entities/mongo/document-content.schema';

interface UpdateChapterDto {
  title?: string;
  content?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentMeta)
    private readonly documentMetaRepository: Repository<DocumentMeta>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectModel(DocumentContent.name)
    private readonly documentContentModel: Model<DocumentContentDocument>,
  ) {}

  async createStory(createStoryDto: CreateStoryDto, ownerId?: number) {
    const meta = this.documentMetaRepository.create({
      title: createStoryDto.title,
      description: createStoryDto.description,
      author: 'Anonymous Author',
      characters: createStoryDto.characters,
      genres: createStoryDto.genres,
      tags: createStoryDto.tags,
      language: createStoryDto.language,
      cover: createStoryDto.cover,
      rating: 0,
      ownerId,
    });

    const savedMeta = (await this.documentMetaRepository.save(
      meta,
    )) as DocumentMeta;

    const content = new this.documentContentModel({
      documentId: savedMeta.id,
      chapters: [
        {
          title: createStoryDto.chapter.title,
          content: createStoryDto.chapter.content,
          comments: (createStoryDto.chapter.comments ?? []) as ChapterComment[],
        },
      ],
      history: [],
    }) as DocumentContentDocument;

    await content.save();

    return {
      id: savedMeta.id,
      title: savedMeta.title,
      description: savedMeta.description,
      author: savedMeta.author,
      characters: savedMeta.characters,
      genres: savedMeta.genres,
      tags: savedMeta.tags,
      language: savedMeta.language,
      cover: savedMeta.cover,
      rating: savedMeta.rating,
      createdAt: savedMeta.createdAt.toISOString(),
      chapters: content.chapters,
    };
  }

  async getAllStories(searchQuery?: string) {
    let metas: DocumentMeta[];

    if (!searchQuery || !searchQuery.trim()) {
      metas = await this.documentMetaRepository.find({
        order: { createdAt: 'DESC' },
      });
    } else {
      const normalizedQuery = `%${searchQuery.toLowerCase()}%`;
      metas = await this.documentMetaRepository
        .createQueryBuilder('meta')
        .where('LOWER(meta.title) LIKE :query', {
          query: normalizedQuery,
        })
        .orWhere('LOWER(meta.description) LIKE :query', {
          query: normalizedQuery,
        })
        .orWhere('LOWER(meta.author) LIKE :query', {
          query: normalizedQuery,
        })
        .orderBy('meta.createdAt', 'DESC')
        .getMany();
    }

    return metas.map((meta) => ({
      id: meta.id,
      title: meta.title,
      description: meta.description,
      author: meta.author,
      characters: meta.characters,
      genres: meta.genres,
      tags: meta.tags,
      language: meta.language,
      cover: meta.cover,
      rating: meta.rating,
      createdAt: meta.createdAt.toISOString(),
    }));
  }

  async updateChapter(
    id: number,
    chapterIndex: number,
    updateChapterDto: UpdateChapterDto,
    userId?: number,
  ) {
    const meta = await this.documentMetaRepository.findOne({
      where: { id },
    });

    if (!meta) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (userId == null || meta.ownerId !== userId) {
      throw new ForbiddenException('You are not allowed to edit this chapter');
    }

    const content = await this.documentContentModel.findOne({
      documentId: id,
    });

    if (!content) {
      throw new NotFoundException(`Content for story ${id} not found`);
    }

    if (
      chapterIndex < 0 ||
      chapterIndex >= content.chapters.length ||
      !content.chapters[chapterIndex]
    ) {
      throw new NotFoundException(
        `Chapter index ${chapterIndex} not found for story ${id}`,
      );
    }

    content.chapters[chapterIndex].title =
      updateChapterDto.title || content.chapters[chapterIndex].title;
    content.chapters[chapterIndex].content =
      updateChapterDto.content || content.chapters[chapterIndex].content;

    await content.save();

    return {
      id,
      chapterIndex,
      chapter: content.chapters[chapterIndex],
    };
  }

  async getStoryById(id: number, userId?: number) {
    const meta = await this.documentMetaRepository.findOne({
      where: { id },
    });
    if (!meta) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    const content = await this.documentContentModel.findOne({
      documentId: id,
    });

    return {
      id: meta.id,
      title: meta.title,
      description: meta.description,
      author: meta.author,
      characters: meta.characters,
      genres: meta.genres,
      tags: meta.tags,
      language: meta.language,
      cover: meta.cover,
      rating: meta.rating,
      createdAt: meta.createdAt.toISOString(),
      chapters: content?.chapters || [],
      ownerId: meta.ownerId as number | undefined,
      isMine: userId != null && meta.ownerId === userId,
    };
  }

  async addComment(
    storyId: number,
    chapterIndex: number,
    dto: CreateCommentDto,
    authorId: number,
  ): Promise<ChapterComment> {
    const { selectedText, text } = dto as {
      selectedText: string;
      text: string;
    };
    const comment: ChapterComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      selectedText,
      text,
      authorId,
      createdAt: new Date(),
      replies: [],
    };

    const pushOp: Record<string, unknown> = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [`chapters.${chapterIndex}.comments`]: comment,
    };
    const result = await this.documentContentModel.findOneAndUpdate(
      {
        documentId: storyId,
        [`chapters.${chapterIndex}`]: { $exists: true },
      },
      { $push: pushOp },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException(
        `Story ${storyId} or chapter ${chapterIndex} not found`,
      );
    }

    return comment;
  }

  async getComments(
    storyId: number,
    chapterIndex: number,
  ): Promise<(ChapterComment & { authorName?: string; replies: (CommentReply & { authorName?: string })[] })[]> {
    type LeanContent = { chapters: { comments?: ChapterComment[] }[] };
    const content = await this.documentContentModel
      .findOne({ documentId: storyId })
      .lean<LeanContent>();

    if (!content) throw new NotFoundException(`Story ${storyId} not found`);
    if (chapterIndex < 0 || chapterIndex >= content.chapters.length) {
      throw new NotFoundException(`Chapter ${chapterIndex} not found`);
    }

    const comments = content.chapters[chapterIndex].comments ?? [];

    // Collect all unique authorIds from comments and replies
    const authorIds = new Set<number>();
    for (const c of comments) {
      if (c.authorId) authorIds.add(c.authorId);
      for (const r of c.replies ?? []) {
        if (r.authorId) authorIds.add(r.authorId);
      }
    }

    // Batch-fetch users from PostgreSQL
    const userMap = new Map<number, string>();
    if (authorIds.size > 0) {
      const users = await this.userRepository.findByIds([...authorIds]);
      for (const u of users) userMap.set(u.id, u.email);
    }

    return comments.map((c) => ({
      ...c,
      authorName: c.authorId ? userMap.get(c.authorId) : undefined,
      replies: (c.replies ?? []).map((r) => ({
        ...r,
        authorName: r.authorId ? userMap.get(r.authorId) : undefined,
      })),
    }));
  }

  async deleteComment(
    storyId: number,
    chapterIndex: number,
    commentId: string,
  ): Promise<{ deleted: string }> {
    const result = await this.documentContentModel.findOneAndUpdate(
      {
        documentId: storyId,
        [`chapters.${chapterIndex}`]: { $exists: true },
      },
      {
        $pull: {
          [`chapters.${chapterIndex}.comments`]: { id: commentId },
        },
      },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException(
        `Story ${storyId} or chapter ${chapterIndex} not found`,
      );
    }

    return { deleted: commentId };
  }

  async addReply(
    storyId: number,
    chapterIndex: number,
    commentId: string,
    text: string,
    authorId: number,
  ): Promise<CommentReply> {
    const reply: CommentReply = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      authorId,
      createdAt: new Date(),
    };

    const result = await this.documentContentModel.findOneAndUpdate(
      {
        documentId: storyId,
        [`chapters.${chapterIndex}.comments`]: { $elemMatch: { id: commentId } },
      },
      {
        $push: {
          [`chapters.${chapterIndex}.comments.$[c].replies`]: reply,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'c.id': commentId }],
      },
    );

    if (!result) {
      throw new NotFoundException(
        `Story ${storyId}, chapter ${chapterIndex} or comment ${commentId} not found`,
      );
    }

    return reply;
  }

  async addChapter(
    storyId: number,
    chapterDto: CreateChapterDto,
    userId?: number,
  ) {
    const meta = await this.documentMetaRepository.findOne({
      where: { id: storyId },
    });

    if (!meta) {
      throw new NotFoundException(`Story with id ${storyId} not found`);
    }

    if (userId == null || meta.ownerId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to add chapters to this story',
      );
    }

    const content = await this.documentContentModel.findOne({
      documentId: storyId,
    });

    if (!content) {
      throw new NotFoundException(`Content for story ${storyId} not found`);
    }

    const newChapter = {
      title: chapterDto.title,
      content: chapterDto.content,
      comments: (chapterDto.comments ?? []) as ChapterComment[],
    };

    content.chapters.push(newChapter);
    await content.save();

    const chapterIndex = content.chapters.length - 1;
    return {
      id: storyId,
      chapterIndex,
      chapter: content.chapters[chapterIndex],
    };
  }

  async deleteChapter(
    storyId: number,
    chapterIndex: number,
    userId?: number,
  ): Promise<{ deleted: number }> {
    const meta = await this.documentMetaRepository.findOne({
      where: { id: storyId },
    });

    if (!meta) {
      throw new NotFoundException(`Story with id ${storyId} not found`);
    }

    if (userId == null || meta.ownerId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete chapters of this story',
      );
    }

    const content = await this.documentContentModel.findOne({
      documentId: storyId,
    });

    if (!content) {
      throw new NotFoundException(`Content for story ${storyId} not found`);
    }

    if (chapterIndex < 0 || chapterIndex >= content.chapters.length) {
      throw new NotFoundException(
        `Chapter index ${chapterIndex} not found for story ${storyId}`,
      );
    }

    content.chapters.splice(chapterIndex, 1);
    await content.save();

    return { deleted: chapterIndex };
  }
}
