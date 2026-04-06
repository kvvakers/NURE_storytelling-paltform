import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { CreateStoryDto } from './dto/create-story.dto';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import {
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
}
