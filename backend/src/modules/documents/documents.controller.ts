import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
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
  @Patch(':id/chapters/:chapterIndex')
  updateChapter(
    @Param('id', ParseIntPipe) id: number,
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
}
