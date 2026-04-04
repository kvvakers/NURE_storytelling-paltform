import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { DocumentsService } from './documents.service';

@Controller('stories')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() createStoryDto: CreateStoryDto) {
    return this.documentsService.createStory(createStoryDto);
  }

  @Get()
  findAll() {
    return this.documentsService.getAllStories();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.getStoryById(id);
  }
}
