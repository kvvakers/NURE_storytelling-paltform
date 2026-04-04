export class CreateChapterDto {
  title: string;
  content: string;
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
