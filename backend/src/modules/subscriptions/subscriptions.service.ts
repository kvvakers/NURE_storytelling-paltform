import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../models/entities/postgres/subscription.entity';
import { User } from '../../models/entities/postgres/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async follow(followerId: number, followingId: number): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const target = await this.userRepository.findOne({ where: { id: followingId } });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.subscriptionRepository.findOne({
      where: { followerId, followingId },
    });
    if (existing) return; // already following — idempotent

    const sub = this.subscriptionRepository.create({ followerId, followingId });
    await this.subscriptionRepository.save(sub);

    // Notify target about new follower
    const follower = await this.userRepository.findOne({ where: { id: followerId } });
    const followerName = follower ? (follower.username || follower.email) : 'Хтось';
    await this.notificationsService.createNotification({
      userId: followingId,
      type: 'follow',
      message: `${followerName} підписався на вас`,
      storyId: undefined,
      chapterIndex: undefined,
    });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.subscriptionRepository.delete({ followerId, followingId });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const sub = await this.subscriptionRepository.findOne({
      where: { followerId, followingId },
    });
    return !!sub;
  }

  async getFollowers(userId: number): Promise<{ id: number; username: string; email: string; avatar?: string }[]> {
    const subs = await this.subscriptionRepository.find({
      where: { followingId: userId },
    });
    if (subs.length === 0) return [];
    const users = await this.userRepository.findByIds(subs.map((s) => s.followerId));
    return users.map((u) => ({ id: u.id, username: u.username, email: u.email, avatar: u.avatar }));
  }

  async getFollowing(userId: number): Promise<{ id: number; username: string; email: string; avatar?: string }[]> {
    const subs = await this.subscriptionRepository.find({
      where: { followerId: userId },
    });
    if (subs.length === 0) return [];
    const users = await this.userRepository.findByIds(subs.map((s) => s.followingId));
    return users.map((u) => ({ id: u.id, username: u.username, email: u.email, avatar: u.avatar }));
  }

  async getFollowerIds(userId: number): Promise<number[]> {
    const subs = await this.subscriptionRepository.find({
      where: { followingId: userId },
    });
    return subs.map((s) => s.followerId);
  }
}
