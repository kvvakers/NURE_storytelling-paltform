import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentMeta)
    private readonly documentMetaRepository: Repository<DocumentMeta>,
    @InjectModel(DocumentContent.name)
    private readonly documentContentModel: Model<DocumentContentDocument>,
  ) {}

  async createStory(createStoryDto: CreateStoryDto) {
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
    });

    const savedMeta = await this.documentMetaRepository.save(meta);

    const content = new this.documentContentModel({
      documentId: savedMeta.id,
      chapters: [
        {
          title: createStoryDto.chapter.title,
          content: createStoryDto.chapter.content,
        },
      ],
      history: [],
    });

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

  async getAllStories() {
    const metas = await this.documentMetaRepository.find({
      order: { createdAt: 'DESC' },
    });

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

  async getStoryById(id: number) {
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
    };
  }
}
