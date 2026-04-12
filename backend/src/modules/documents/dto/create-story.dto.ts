export class CreateCommentDto {
  id: string;
  selectedText: string;
  text: string;
}

export class CreateChapterDto {
  title: string;
  content: string;
  comments?: CreateCommentDto[];
}

export class CreateStoryDto {
  title: string;
  description: string;
  characters?: string;
  genres: string[];
  tags: string[];
  language: string;
  cover: string;
  chapter: CreateChapterDto;
}
