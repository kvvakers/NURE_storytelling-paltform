import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { LibraryCategory } from '../../models/entities/postgres/library-category.entity';
import { LibraryItem } from '../../models/entities/postgres/library-item.entity';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import { StoryLike } from '../../models/entities/postgres/story-like.entity';
import { User } from '../../models/entities/postgres/user.entity';
import { CreateLibraryCategoryDto } from './dto/create-library-category.dto';
import { NotificationsService } from '../notifications/notifications.service';

const FAVORITES_TITLE = 'Улюблені';
const BOOKMARKS_TITLE = 'Закладки';

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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  getCategories(userId: number): Promise<LibraryCategory[]> {
    return this.categoryRepo.find({ where: { userId } });
  }

  createCategory(dto: CreateLibraryCategoryDto, userId: number): Promise<LibraryCategory> {
    const cat = this.categoryRepo.create({ title: dto.title, userId });
    return this.categoryRepo.save(cat);
  }

  // sendNotification=false when called internally from likeStory to avoid double notification
  async addToLibrary(storyId: number, userId: number, categoryId?: number | null, sendNotification = true) {
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

    if (sendNotification && story.ownerId && story.ownerId !== userId) {
      const actor = await this.userRepo.findOne({ where: { id: userId } });
      const actorName = actor ? (actor.username || actor.email) : 'Читач';
      await this.notificationsService.createNotification({
        userId: story.ownerId,
        type: 'library_add',
        message: `${actorName} додав вашу історію «${story.title}» до своєї бібліотеки`,
        storyId,
      });
    }

    return { storyId, userId, categoryId: categoryId ?? null };
  }

  async likeStory(storyId: number, userId: number) {
    const story = await this.metaRepo.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException(`Story ${storyId} not found`);

    const existingLike = await this.likeRepo.findOne({ where: { storyId, userId } });
    if (!existingLike) {
      await this.likeRepo.save(this.likeRepo.create({ storyId, userId }));
    }

    // Add to "all" without sending a library notification (like notification covers this)
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

    const existingFav = await this.itemRepo.findOne({ where: { storyId, userId, categoryId: favCat.id } });
    if (!existingFav) {
      await this.itemRepo.save(this.itemRepo.create({ storyId, userId, categoryId: favCat.id }));
    }

    // Send like notification (only once per like action)
    if (!existingLike && story.ownerId && story.ownerId !== userId) {
      const actor = await this.userRepo.findOne({ where: { id: userId } });
      const actorName = actor ? (actor.username || actor.email) : 'Читач';
      await this.notificationsService.createNotification({
        userId: story.ownerId,
        type: 'like',
        message: `${actorName} вподобав вашу історію «${story.title}»`,
        storyId,
      });
    }

    const likeCount = await this.likeRepo.count({ where: { storyId } });
    return { liked: true, likeCount };
  }

  async unlikeStory(storyId: number, userId: number) {
    await this.likeRepo.delete({ storyId, userId });

    const favCat = await this.categoryRepo.findOne({ where: { title: FAVORITES_TITLE, userId } });
    if (favCat) {
      await this.itemRepo.delete({ storyId, userId, categoryId: favCat.id });
    }

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

  async setBookmark(storyId: number, userId: number, chapterIndex: number) {
    const story = await this.metaRepo.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException(`Story ${storyId} not found`);

    let allItem = await this.itemRepo.findOne({ where: { storyId, userId, categoryId: IsNull() } });
    const isTogglingOff = allItem?.bookmarkChapterIndex === chapterIndex;

    if (!allItem) {
      allItem = await this.itemRepo.save(
        this.itemRepo.create({ storyId, userId, categoryId: null, bookmarkChapterIndex: chapterIndex }),
      );
    } else {
      allItem.bookmarkChapterIndex = isTogglingOff ? null : chapterIndex;
      allItem = await this.itemRepo.save(allItem);
    }

    let bookmarkCat = await this.categoryRepo.findOne({ where: { title: BOOKMARKS_TITLE, userId } });

    if (isTogglingOff) {
      if (bookmarkCat) {
        await this.itemRepo.delete({ storyId, userId, categoryId: bookmarkCat.id });
      }
    } else {
      if (!bookmarkCat) {
        bookmarkCat = await this.categoryRepo.save(
          this.categoryRepo.create({ title: BOOKMARKS_TITLE, userId }),
        );
      }
      const existing = await this.itemRepo.findOne({ where: { storyId, userId, categoryId: bookmarkCat.id } });
      if (!existing) {
        await this.itemRepo.save(this.itemRepo.create({ storyId, userId, categoryId: bookmarkCat.id }));
      }
    }

    return { storyId, userId, bookmarkChapterIndex: allItem.bookmarkChapterIndex };
  }

  async checkInLibrary(storyId: number, userId: number) {
    const items = await this.itemRepo.find({ where: { storyId, userId } });
    const liked = !!(await this.likeRepo.findOne({ where: { storyId, userId } }));
    const inLibrary = items.length > 0 || liked;
    const categories = items.filter(i => i.categoryId != null).map(i => i.categoryId as number);
    const allItem = items.find(i => i.categoryId == null);
    const bookmarkChapterIndex = allItem?.bookmarkChapterIndex ?? null;
    return { inLibrary, liked, categories, bookmarkChapterIndex };
  }

  async getLibrary(userId: number) {
    const items = await this.itemRepo.find({ where: { userId } });
    const categories = await this.categoryRepo.find({ where: { userId } });

    const storyIds = [...new Set(items.map(i => i.storyId))];

    const stories = storyIds.length > 0
      ? await this.metaRepo.findBy({ id: In(storyIds) })
      : [];
    const storyMap = new Map(stories.map(s => [s.id, s]));

    const bookmarkMap = new Map(
      items.filter(i => i.categoryId == null).map(i => [i.storyId, i.bookmarkChapterIndex ?? null]),
    );

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
        bookmarkChapterIndex: bookmarkMap.get(id) ?? null,
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
