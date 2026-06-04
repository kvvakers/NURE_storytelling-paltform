import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from '../../models/entities/postgres/notification.entity';
import { CoAuthorInvitation } from '../../models/entities/postgres/co-author-invitation.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(CoAuthorInvitation)
    private readonly invitationRepository: Repository<CoAuthorInvitation>,
  ) {}

  async createNotification(data: {
    userId: number;
    type?: string;
    message: string;
    storyId?: number;
    chapterIndex?: number;
    relatedId?: number;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      type: data.type ?? 'comment',
      message: data.message,
      storyId: data.storyId,
      chapterIndex: data.chapterIndex,
      relatedId: data.relatedId,
      read: false,
    });
    return this.notificationRepository.save(notification);
  }

  async getForUser(userId: number): Promise<(Notification & { responded?: boolean; respondedAccepted?: boolean })[]> {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const inviteNotifications = notifications.filter(
      n => n.type === 'co_author_invite' && n.relatedId != null,
    );

    if (inviteNotifications.length === 0) return notifications;

    const invitationIds = inviteNotifications.map(n => n.relatedId as number);
    const invitations = await this.invitationRepository.find({
      where: { id: In(invitationIds) },
    });
    const invitationMap = new Map(invitations.map(inv => [inv.id, inv.status]));

    return notifications.map(n => {
      if (n.type !== 'co_author_invite' || n.relatedId == null) return n;
      const status = invitationMap.get(n.relatedId);
      if (!status || status === 'pending') return n;
      return Object.assign(Object.create(Object.getPrototypeOf(n)), n, {
        responded: true,
        respondedAccepted: status === 'accepted',
      });
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update({ userId, read: false }, { read: true });
  }
}
