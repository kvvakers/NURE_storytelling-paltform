import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LibraryService } from './library.service';
import { CreateLibraryCategoryDto } from './dto/create-library-category.dto';
import { AddToLibraryDto } from './dto/add-to-library.dto';
import { SetBookmarkDto } from './dto/set-bookmark.dto';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  getLibrary(@Request() req: any) {
    return this.libraryService.getLibrary(req.user.userId);
  }

  @Get('categories')
  getCategories(@Request() req: any) {
    return this.libraryService.getCategories(req.user.userId);
  }

  @Post('categories')
  createCategory(@Body() dto: CreateLibraryCategoryDto, @Request() req: any) {
    return this.libraryService.createCategory(dto, req.user.userId);
  }

  @Get('check/:storyId')
  checkInLibrary(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Request() req: any,
  ) {
    return this.libraryService.checkInLibrary(storyId, req.user.userId);
  }

  @Post(':storyId/like')
  likeStory(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Request() req: any,
  ) {
    return this.libraryService.likeStory(storyId, req.user.userId);
  }

  @Delete(':storyId/like')
  unlikeStory(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Request() req: any,
  ) {
    return this.libraryService.unlikeStory(storyId, req.user.userId);
  }

  @Patch(':storyId/bookmark')
  setBookmark(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() dto: SetBookmarkDto,
    @Request() req: any,
  ) {
    return this.libraryService.setBookmark(storyId, req.user.userId, dto.chapterIndex);
  }

  @Post(':storyId')
  addToLibrary(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() dto: AddToLibraryDto,
    @Request() req: any,
  ) {
    return this.libraryService.addToLibrary(storyId, req.user.userId, dto.categoryId);
  }

  @Delete(':storyId')
  removeFromLibrary(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Request() req: any,
  ) {
    return this.libraryService.removeFromLibrary(storyId, req.user.userId);
  }
}
