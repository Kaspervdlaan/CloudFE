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

