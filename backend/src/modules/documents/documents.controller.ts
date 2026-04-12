import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateStoryDto, CreateCommentDto, CreateChapterDto } from './dto/create-story.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('stories')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createStoryDto: CreateStoryDto, @Request() req: any) {
    return this.documentsService.createStory(createStoryDto, req.user?.userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query('query') query?: string) {
    return this.documentsService.getAllStories(query);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.documentsService.getStoryById(id, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/chapters')
  addChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() createChapterDto: CreateChapterDto,
    @Request() req: any,
  ) {
    return this.documentsService.addChapter(id, createChapterDto, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/chapters/:chapterIndex')
  updateChapter(    @Param('id', ParseIntPipe) id: number,
    @Param('chapterIndex', ParseIntPipe) chapterIndex: number,
    @Body() updateChapterDto: UpdateChapterDto,
    @Request() req: any,
  ) {
    return this.documentsService.updateChapter(
      id,
      chapterIndex,
      updateChapterDto,
      req.user?.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/chapters/:chapterIndex')
  deleteChapter(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterIndex', ParseIntPipe) chapterIndex: number,
    @Request() req: any,
  ) {
    return this.documentsService.deleteChapter(id, chapterIndex, req.user?.userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/chapters/:chapterIndex/comments')
  getComments(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterIndex', ParseIntPipe) chapterIndex: number,
  ) {
    return this.documentsService.getComments(id, chapterIndex);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/chapters/:chapterIndex/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterIndex', ParseIntPipe) chapterIndex: number,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ) {
    return this.documentsService.addComment(
      id,
      chapterIndex,
      createCommentDto,
      req.user?.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/chapters/:chapterIndex/comments/:commentId')
  deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterIndex', ParseIntPipe) chapterIndex: number,
    @Param('commentId') commentId: string,
  ) {
    return this.documentsService.deleteComment(
      id,
      chapterIndex,
      commentId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/chapters/:chapterIndex/comments/:commentId/replies')
  addReply(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterIndex', ParseIntPipe) chapterIndex: number,
    @Param('commentId') commentId: string,
    @Body('text') text: string,
    @Request() req: any,
  ) {
    return this.documentsService.addReply(
      id,
      chapterIndex,
      commentId,
      text,
      req.user?.userId,
    );
  }
}
