export interface TorrentDownload {
  gid: string;
  status: string;
  name?: string;
  totalLength?: number;
  completedLength?: number;
  uploadSpeed?: number;
  downloadSpeed?: number;
  progress?: number;
  [key: string]: any; // Allow for additional properties
}

export interface AddTorrentRequest {
  magnetLink: string;
}

export interface AddTorrentResponse {
  gid: string;
}

export interface TorrentSearchResult {
  title: string;
  size: number;
  sizeFormatted: string;
  seeders: number;
  leechers: number;
  magnetUri: string;
  tracker: string;
  publishDate: string;
  category: string[];
}

export interface TorrentSearchResponse {
  query: string;
  category: string;
  count: number;
  results: TorrentSearchResult[];
}

export type TorrentCategory = 
  | 'movies' 
  | 'movies_hd' 
  | 'movies_4k' 
  | 'tv' 
  | 'tv_hd' 
  | 'music' 
  | 'games' 
  | 'software' 
  | 'books' 
  | 'anime';
