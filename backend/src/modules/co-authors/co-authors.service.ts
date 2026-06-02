import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoAuthorInvitation } from '../../models/entities/postgres/co-author-invitation.entity';
import { DocumentMeta } from '../../models/entities/postgres/document-meta.entity';
import { User } from '../../models/entities/postgres/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CoAuthorsService {
  constructor(
    @InjectRepository(CoAuthorInvitation)
    private readonly invitationRepository: Repository<CoAuthorInvitation>,
    @InjectRepository(DocumentMeta)
    private readonly documentMetaRepository: Repository<DocumentMeta>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async invite(storyId: number, inviterId: number, inviteeId: number) {
    const meta = await this.documentMetaRepository.findOne({ where: { id: storyId } });
    if (!meta) throw new NotFoundException('Story not found');
    if (meta.ownerId !== inviterId) throw new ForbiddenException('Only the story owner can invite co-authors');
    if (inviteeId === inviterId) throw new BadRequestException('Cannot invite yourself');

    if ((meta.coAuthorIds ?? []).includes(inviteeId)) {
      throw new BadRequestException('User is already a co-author');
    }

    const existing = await this.invitationRepository.findOne({
      where: { storyId, inviteeId, status: 'pending' },
    });
    if (existing) throw new BadRequestException('Invitation already sent');

    const invitee = await this.userRepository.findOne({ where: { id: inviteeId } });
    if (!invitee) throw new NotFoundException('Invitee not found');

    const invitation = this.invitationRepository.create({ storyId, inviterId, inviteeId, status: 'pending' });
    const saved = await this.invitationRepository.save(invitation);

    const inviter = await this.userRepository.findOne({ where: { id: inviterId } });
    const inviterName = inviter ? (inviter.username || inviter.email) : 'Автор';

    await this.notificationsService.createNotification({
      userId: inviteeId,
      type: 'co_author_invite',
      message: `${inviterName} запросив вас як співавтора до історії «${meta.title}»`,
      storyId,
      relatedId: saved.id,
    });

    return { invitationId: saved.id, status: saved.status };
  }

  async respondToInvitation(invitationId: number, userId: number, accept: boolean) {
    const invitation = await this.invitationRepository.findOne({ where: { id: invitationId } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.inviteeId !== userId) throw new ForbiddenException('This invitation is not for you');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation already responded to');

    invitation.status = accept ? 'accepted' : 'declined';
    await this.invitationRepository.save(invitation);

    const invitee = await this.userRepository.findOne({ where: { id: userId } });
    const inviteeName = invitee ? (invitee.username || invitee.email) : 'Користувач';

    if (accept) {
      const meta = await this.documentMetaRepository.findOne({ where: { id: invitation.storyId } });
      if (meta) {
        const ids = meta.coAuthorIds ?? [];
        if (!ids.includes(userId)) {
          meta.coAuthorIds = [...ids, userId];
          await this.documentMetaRepository.save(meta);
        }
      }

      await this.notificationsService.createNotification({
        userId: invitation.inviterId,
        type: 'co_author_accepted',
        message: `${inviteeName} прийняв ваше запрошення до співавторства`,
        storyId: invitation.storyId,
      });
    } else {
      await this.notificationsService.createNotification({
        userId: invitation.inviterId,
        type: 'co_author_declined',
        message: `${inviteeName} відхилив ваше запрошення до співавторства`,
        storyId: invitation.storyId,
      });
    }

    return { invitationId, status: invitation.status };
  }

  async getCoAuthors(storyId: number) {
    const meta = await this.documentMetaRepository.findOne({ where: { id: storyId } });
    if (!meta) throw new NotFoundException('Story not found');
    if (!(meta.coAuthorIds ?? []).length) return [];

    const users = await this.userRepository.findByIds(meta.coAuthorIds);
    return users.map(u => ({ id: u.id, username: u.username, email: u.email, avatar: u.avatar }));
  }

  async isCoAuthor(storyId: number, userId: number): Promise<boolean> {
    const meta = await this.documentMetaRepository.findOne({ where: { id: storyId } });
    return (meta?.coAuthorIds ?? []).includes(userId);
  }

  async getCoAuthoredStories(userId: number) {
    const metas = await this.documentMetaRepository
      .createQueryBuilder('meta')
      .where(':userId = ANY(meta.coAuthorIds)', { userId })
      .orderBy('meta.createdAt', 'DESC')
      .getMany();

    if (!metas.length) return [];

    const ownerIds = [...new Set(metas.map(m => m.ownerId).filter((id): id is number => id != null))];
    const ownerMap = new Map<number, string>();
    if (ownerIds.length) {
      const users = await this.userRepository.findByIds(ownerIds);
      for (const u of users) ownerMap.set(u.id, u.username || u.email);
    }

    return metas.map(meta => ({
      id: meta.id,
      title: meta.title,
      description: meta.description,
      author: meta.ownerId ? (ownerMap.get(meta.ownerId) ?? meta.author) : meta.author,
      cover: meta.cover,
      rating: meta.rating,
      genres: meta.genres,
      tags: meta.tags,
      status: meta.status,
      ownerId: meta.ownerId,
      seriesId: meta.seriesId ?? null,
      createdAt: meta.createdAt.toISOString(),
      created_at: meta.createdAt.toISOString(),
      isCoAuthored: true,
    }));
  }
}
