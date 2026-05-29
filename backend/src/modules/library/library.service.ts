import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { LibraryCategory } from '../../models/entities/postgres/library-category.entity';
import { LibraryItem } from '../../models/entities/postgres/library-item.entity';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import { StoryLike } from '../../models/entities/postgres/story-like.entity';
import { CreateLibraryCategoryDto } from './dto/create-library-category.dto';

const FAVORITES_TITLE = 'Улюблені';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryCategory)
    private readonly categoryRepo: Repository<LibraryCategory>,
    @InjectRepository(LibraryItem)
    private readonly itemRepo: Repository<LibraryItem>,
    @InjectRepository(DocumentMeta)
    private readonly metaRepo: Repository<DocumentMeta>,
    @InjectRepository(StoryLike)
    private readonly likeRepo: Repository<StoryLike>,
  ) {}

  getCategories(userId: number): Promise<LibraryCategory[]> {
    return this.categoryRepo.find({ where: { userId } });
  }

  createCategory(dto: CreateLibraryCategoryDto, userId: number): Promise<LibraryCategory> {
    const cat = this.categoryRepo.create({ title: dto.title, userId });
    return this.categoryRepo.save(cat);
  }

  async addToLibrary(storyId: number, userId: number, categoryId?: number | null) {
    const story = await this.metaRepo.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException(`Story ${storyId} not found`);

    const existingAll = await this.itemRepo.findOne({ where: { storyId, userId, categoryId: IsNull() } });
    if (!existingAll) {
      await this.itemRepo.save(this.itemRepo.create({ storyId, userId, categoryId: null }));
    }

    if (categoryId != null) {
      const existingCat = await this.itemRepo.findOne({ where: { storyId, userId, categoryId } });
      if (!existingCat) {
        await this.itemRepo.save(this.itemRepo.create({ storyId, userId, categoryId }));
      }
    }

    return { storyId, userId, categoryId: categoryId ?? null };
  }

  async likeStory(storyId: number, userId: number) {
    const story = await this.metaRepo.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException(`Story ${storyId} not found`);

    // Create like if not exists
    const existingLike = await this.likeRepo.findOne({ where: { storyId, userId } });
    if (!existingLike) {
      await this.likeRepo.save(this.likeRepo.create({ storyId, userId }));
    }

    // Ensure story is in "all"
    const existingAll = await this.itemRepo.findOne({ where: { storyId, userId, categoryId: IsNull() } });
    if (!existingAll) {
      await this.itemRepo.save(this.itemRepo.create({ storyId, userId, categoryId: null }));
    }

    // Find or create "Улюблені" category
    let favCat = await this.categoryRepo.findOne({ where: { title: FAVORITES_TITLE, userId } });
    if (!favCat) {
      favCat = await this.categoryRepo.save(
        this.categoryRepo.create({ title: FAVORITES_TITLE, userId }),
      );
    }

    // Add to "Улюблені"
    const existingFav = await this.itemRepo.findOne({ where: { storyId, userId, categoryId: favCat.id } });
    if (!existingFav) {
      await this.itemRepo.save(this.itemRepo.create({ storyId, userId, categoryId: favCat.id }));
    }

    const likeCount = await this.likeRepo.count({ where: { storyId } });
    return { liked: true, likeCount };
  }

  async unlikeStory(storyId: number, userId: number) {
    await this.likeRepo.delete({ storyId, userId });

    // Remove from "Улюблені"
    const favCat = await this.categoryRepo.findOne({ where: { title: FAVORITES_TITLE, userId } });
    if (favCat) {
      await this.itemRepo.delete({ storyId, userId, categoryId: favCat.id });
    }

    // If no other user-created category entries remain, remove from "all" too
    const remainingCats = await this.itemRepo.find({ where: { storyId, userId } });
    const hasOtherCategories = remainingCats.some(i => i.categoryId != null);
    if (!hasOtherCategories) {
      await this.itemRepo.delete({ storyId, userId, categoryId: IsNull() as any });
    }

    const likeCount = await this.likeRepo.count({ where: { storyId } });
    return { liked: false, likeCount };
  }

  async removeFromLibrary(storyId: number, userId: number) {
    await this.itemRepo.delete({ storyId, userId });
    await this.likeRepo.delete({ storyId, userId });
    return { deleted: storyId };
  }

  async checkInLibrary(storyId: number, userId: number) {
    const items = await this.itemRepo.find({ where: { storyId, userId } });
    const liked = !!(await this.likeRepo.findOne({ where: { storyId, userId } }));
    const inLibrary = items.length > 0 || liked;
    const categories = items.filter(i => i.categoryId != null).map(i => i.categoryId as number);
    return { inLibrary, liked, categories };
  }

  async getLibrary(userId: number) {
    const items = await this.itemRepo.find({ where: { userId } });
    const categories = await this.categoryRepo.find({ where: { userId } });

    const storyIds = [...new Set(items.map(i => i.storyId))];

    const stories = storyIds.length > 0
      ? await this.metaRepo.findBy({ id: In(storyIds) })
      : [];
    const storyMap = new Map(stories.map(s => [s.id, s]));

    const toDto = (id: number) => {
      const s = storyMap.get(id);
      if (!s) return null;
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        author: s.author,
        cover: s.cover,
        rating: s.rating,
        genres: s.genres,
        tags: s.tags,
        status: s.status,
        ownerId: s.ownerId,
        created_at: s.createdAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      };
    };

    const all = storyIds.map(toDto).filter(Boolean);

    const categoryGroups = categories.map(cat => ({
      id: cat.id,
      title: cat.title,
      stories: items
        .filter(i => i.categoryId === cat.id)
        .map(i => toDto(i.storyId))
        .filter(Boolean),
    }));

    return { all, categories: categoryGroups };
  }
}
