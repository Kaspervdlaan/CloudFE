export interface YouTubeDownloadRequest {
  url: string;
  format: 'mp3' | 'mp4';
}

export interface YouTubeJob {
  jobId: string;
  url: string;
  format: 'mp3' | 'mp4';
  status: 'queued' | 'downloading' | 'completed' | 'error';
  progress?: number; // 0-100
  filename?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  output?: string;
}

