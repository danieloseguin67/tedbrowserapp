export interface TedVideo {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  speaker: string;
  link: string;
  category: string;
  publishedDate: string;
  youtubeId?: string;
}

export interface SearchResponse {
  items: TedVideo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
