export class UpdateStoryDto {
  title?: string;
  description?: string;
  characters?: string;
  genres?: string[];
  tags?: string[];
  language?: string;
  cover?: string;
  seriesId?: number | null;
  status?: string;
}
