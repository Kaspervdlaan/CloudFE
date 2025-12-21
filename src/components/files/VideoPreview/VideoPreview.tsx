import { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { File } from '../../../types/file';
import { isVideoFile } from '../../../utils/fileUtils';
import { api } from '../../../utils/api';
import './_VideoPreview.scss';

interface VideoPreviewProps {
  isOpen: boolean;
  file: File | null;
  files: File[];
  onClose: () => void;
}

export function VideoPreview({ isOpen, file, files, onClose }: VideoPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoFiles = files.filter(f => isVideoFile(f));
  const videoFileIds = useMemo(() => videoFiles.map(f => f.id), [videoFiles]);

  // Only set index when the file prop changes (initial open), not when navigating
  useEffect(() => {
    if (file && isVideoFile(file) && isOpen) {
      const index = videoFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [file?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setIsMuted(false);
      setVolume(1);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      // Clean up blob URLs when preview closes
      Object.values(videoUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setVideoUrls({});
    }
  }, [isOpen]);

  // Fetch videos with authentication and create blob URLs
  useEffect(() => {
    if (!isOpen || videoFiles.length === 0) return;

    const loadVideos = async () => {
      const newUrls: Record<string, string> = {};
      
      for (const videoFile of videoFiles) {
        // Skip if already loaded
        if (videoUrls[videoFile.id]) {
          continue;
        }

        try {
          const blob = await api.downloadFile(videoFile.id);
          const blobUrl = URL.createObjectURL(blob);
          newUrls[videoFile.id] = blobUrl;
        } catch (err) {
          console.error(`Failed to load video ${videoFile.id}:`, err);
        }
      }

      if (Object.keys(newUrls).length > 0) {
        setVideoUrls(prev => ({ ...prev, ...newUrls }));
      }
    };

    loadVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, videoFileIds.join(',')]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(videoUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < videoFiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, videoFiles.length, onClose]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < videoFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    togglePlay();
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  if (!isOpen || !file || videoFiles.length === 0) return null;

  const currentFile = videoFiles[currentIndex];
  // Use blob URL if available, otherwise fall back to downloadUrl
  const videoUrl = videoUrls[currentFile.id] || currentFile.downloadUrl;

  return (
    <div className="video-preview" onClick={onClose}>
      <div className="video-preview__container" onClick={(e) => e.stopPropagation()}>
        <button className="video-preview__close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="video-preview__video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            className="video-preview__video"
            onEnded={handleVideoEnded}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onClick={handlePlayPause}
          />
        </div>

        <div className="video-preview__controls">
          <div className="video-preview__nav">
            <button
              className="video-preview__button"
              onClick={(e) => handlePrevious(e)}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="video-preview__counter">
              {currentIndex + 1} / {videoFiles.length}
            </span>
            <button
              className="video-preview__button"
              onClick={(e) => handleNext(e)}
              disabled={currentIndex === videoFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="video-preview__playback">
            <button className="video-preview__button" onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className="video-preview__button" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="video-preview__volume-slider"
              aria-label="Volume"
            />
            <button className="video-preview__button" onClick={handleFullscreen} aria-label="Fullscreen">
              <Maximize size={20} />
            </button>
          </div>
        </div>

        <div className="video-preview__info">
          <div className="video-preview__name">{currentFile.name}</div>
        </div>
      </div>
    </div>
  );
}

