import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../models/entities/postgres/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(data: {
    userId: number;
    type?: string;
    message: string;
    storyId?: number;
    chapterIndex?: number;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      type: data.type ?? 'comment',
      message: data.message,
      storyId: data.storyId,
      chapterIndex: data.chapterIndex,
      read: false,
    });
    return this.notificationRepository.save(notification);
  }

  async getForUser(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
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
