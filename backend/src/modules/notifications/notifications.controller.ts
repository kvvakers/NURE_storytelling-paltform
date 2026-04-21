import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@Request() req: any) {
    return this.notificationsService.getForUser(req.user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return this.notificationsService
      .getUnreadCount(req.user.userId)
      .then((count) => ({ count }));
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notificationsService
      .markAllAsRead(req.user.userId)
      .then(() => ({ ok: true }));
  }
}
