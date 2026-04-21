import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('users')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /** Підписатися на користувача */
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  follow(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.subscriptionsService
      .follow(req.user.userId, id)
      .then(() => ({ ok: true }));
  }

  /** Відписатися */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  unfollow(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.subscriptionsService
      .unfollow(req.user.userId, id)
      .then(() => ({ ok: true }));
  }

  /** Чи підписаний поточний юзер */
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/follow-status')
  followStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    if (!req.user?.userId) return { following: false };
    return this.subscriptionsService
      .isFollowing(req.user.userId, id)
      .then((following) => ({ following }));
  }

  /** Список підписників */
  @Get(':id/followers')
  getFollowers(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.getFollowers(id);
  }

  /** Список підписок */
  @Get(':id/following')
  getFollowing(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.getFollowing(id);
  }
}
