import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CoAuthorsService } from './co-authors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class CoAuthorsController {
  constructor(private readonly coAuthorsService: CoAuthorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('stories/:id/co-authors/invite')
  invite(
    @Param('id', ParseIntPipe) storyId: number,
    @Body('inviteeId', ParseIntPipe) inviteeId: number,
    @Request() req: any,
  ) {
    return this.coAuthorsService.invite(storyId, req.user.userId, inviteeId);
  }

  @Get('stories/:id/co-authors')
  getCoAuthors(@Param('id', ParseIntPipe) storyId: number) {
    return this.coAuthorsService.getCoAuthors(storyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('co-authors/invitations/:id/accept')
  accept(
    @Param('id', ParseIntPipe) invitationId: number,
    @Request() req: any,
  ) {
    return this.coAuthorsService.respondToInvitation(invitationId, req.user.userId, true);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('co-authors/invitations/:id/decline')
  decline(
    @Param('id', ParseIntPipe) invitationId: number,
    @Request() req: any,
  ) {
    return this.coAuthorsService.respondToInvitation(invitationId, req.user.userId, false);
  }

  @Get('users/:id/co-authored-stories')
  getCoAuthoredStories(@Param('id', ParseIntPipe) userId: number) {
    return this.coAuthorsService.getCoAuthoredStories(userId);
  }
}
