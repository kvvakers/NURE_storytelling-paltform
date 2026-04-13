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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { CreateStoryDto, CreateCommentDto, CreateChapterDto } from './dto/create-story.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('stories')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload-cover')
  @UseInterceptors(
    FileInterceptor('cover', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
        cb(null, allowed.test(file.originalname));
      },
    }),
  )
  uploadCover(@UploadedFile() file: any) {
    const coversDir = join(process.cwd(), 'uploads', 'covers');
    mkdirSync(coversDir, { recursive: true });
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    writeFileSync(join(coversDir, filename), file.buffer as Buffer);
    return { url: `/uploads/covers/${filename}` };
  }

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
  @Patch(':id')
  updateStory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoryDto,
    @Request() req: any,
  ) {
    return this.documentsService.updateStory(id, dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteStory(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.documentsService.deleteStory(id, req.user.userId);
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
