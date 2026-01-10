import { Button } from '../../common/Button/Button';
import { MdStop, MdRefresh } from 'react-icons/md';
import './_DownloadList.scss';
import type { TorrentDownload } from '../../../types/torrent';
import type { YouTubeJob } from '../../../types/youtube';

interface DownloadListProps {
  torrentDownloads: TorrentDownload[];
  youtubeJobs: YouTubeJob[];
  isLoadingTorrents?: boolean;
  isLoadingYouTube?: boolean;
  onRefresh?: () => void;
  onStopTorrent?: (gid: string) => void;
}

type UnifiedDownload = 
  | { type: 'torrent'; data: TorrentDownload }
  | { type: 'youtube'; data: YouTubeJob };

export function DownloadList({
  torrentDownloads,
  youtubeJobs,
  isLoadingTorrents = false,
  isLoadingYouTube = false,
  onRefresh,
  onStopTorrent,
}: DownloadListProps) {
  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec?: number): string => {
    if (!bytesPerSec) return '0 B/s';
    return formatBytes(bytesPerSec) + '/s';
  };

  const getTorrentProgress = (download: TorrentDownload): number => {
    if (!download.totalLength || download.totalLength === 0) return 0;
    const completed = download.completedLength || 0;
    return Math.round((completed / download.totalLength) * 100);
  };

  // Combine downloads into unified list
  const unifiedDownloads: UnifiedDownload[] = [
    ...torrentDownloads.map((download) => ({ type: 'torrent' as const, data: download })),
    ...youtubeJobs.map((job) => ({ type: 'youtube' as const, data: job })),
  ];

  // Sort by creation/start time (newest first)
  unifiedDownloads.sort((a, b) => {
    const aTime = a.type === 'torrent' 
      ? new Date((a.data as any).addedDate || Date.now()).getTime()
      : new Date(a.data.createdAt).getTime();
    const bTime = b.type === 'torrent'
      ? new Date((b.data as any).addedDate || Date.now()).getTime()
      : new Date(b.data.createdAt).getTime();
    return bTime - aTime;
  });

  const isLoading = isLoadingTorrents || isLoadingYouTube;
  const hasDownloads = unifiedDownloads.length > 0;

  return (
    <div className="download-list">
      <div className="download-list__header">
        <h2 className="download-list__title">Active Downloads</h2>
        {onRefresh && (
          <Button
            variant="ghost"
            onClick={onRefresh}
            disabled={isLoading}
            className="download-list__refresh-button"
          >
            <MdRefresh size={20} />
            Refresh
          </Button>
        )}
      </div>

      {isLoading && !hasDownloads ? (
        <div className="download-list__loading">Loading downloads...</div>
      ) : !hasDownloads ? (
        <div className="download-list__empty">No active downloads</div>
      ) : (
        <div className="download-list__items">
          {unifiedDownloads.map((item) => {
            if (item.type === 'torrent') {
              const download = item.data;
              const progress = getTorrentProgress(download);
              
              return (
                <div key={`torrent-${download.gid}`} className="download-list__item download-list__item--torrent">
                  <div className="download-list__item-info">
                    <div className="download-list__item-name">
                      {download.name || download.gid}
                    </div>
                    <div className="download-list__item-badge download-list__item-badge--torrent">
                      Torrent
                    </div>
                    <div className="download-list__item-details">
                      <span>{progress}%</span>
                      <span>•</span>
                      <span>{formatSpeed(download.downloadSpeed)}</span>
                      <span>•</span>
                      <span>{formatBytes(download.completedLength)} / {formatBytes(download.totalLength)}</span>
                    </div>
                    <div className="download-list__item-progress">
                      <div 
                        className="download-list__item-progress-bar"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  {onStopTorrent && (
                    <Button
                      variant="ghost"
                      onClick={() => onStopTorrent(download.gid)}
                      className="download-list__stop-button"
                    >
                      <MdStop size={14} />
                      Stop
                    </Button>
                  )}
                </div>
              );
            } else {
              const job = item.data;
              
              return (
                <div key={`youtube-${job.jobId}`} className="download-list__item download-list__item--youtube">
                  <div className="download-list__item-info">
                    <div className="download-list__item-name">
                      {job.filename || job.url}
                    </div>
                    <div className="download-list__item-badge download-list__item-badge--youtube">
                      YouTube {job.format.toUpperCase()}
                    </div>
                    <div className="download-list__item-details">
                      <span className={`download-list__item-status download-list__item-status--${job.status}`}>
                        {job.status}
                      </span>
                      {job.progress !== undefined && (
                        <>
                          <span>•</span>
                          <span>{job.progress}%</span>
                        </>
                      )}
                      {job.error && (
                        <>
                          <span>•</span>
                          <span className="download-list__item-error">{job.error}</span>
                        </>
                      )}
                    </div>
                    {job.progress !== undefined && job.progress > 0 && (
                      <div className="download-list__item-progress">
                        <div 
                          className="download-list__item-progress-bar"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

