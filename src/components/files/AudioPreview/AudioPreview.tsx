import { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { File } from '../../../types/file';
import { isAudioFile } from '../../../utils/fileUtils';
import { api } from '../../../utils/api';
import './_AudioPreview.scss';

interface AudioPreviewProps {
  isOpen: boolean;
  file: File | null;
  files: File[];
  onClose: () => void;
}

export function AudioPreview({ isOpen, file, files, onClose }: AudioPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioFiles = files.filter(f => isAudioFile(f));
  const audioFileIds = useMemo(() => audioFiles.map(f => f.id), [audioFiles]);

  // Only set index when the file prop changes (initial open), not when navigating
  useEffect(() => {
    if (file && isAudioFile(file) && isOpen) {
      const index = audioFiles.findIndex(f => f.id === file.id);
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
      setCurrentTime(0);
      setDuration(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      // Clean up blob URLs when preview closes
      Object.values(audioUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setAudioUrls({});
    }
  }, [isOpen]);

  // Fetch audio files with authentication and create blob URLs
  useEffect(() => {
    if (!isOpen || audioFiles.length === 0) return;

    const loadAudios = async () => {
      const newUrls: Record<string, string> = {};
      
      for (const audioFile of audioFiles) {
        // Skip if already loaded
        if (audioUrls[audioFile.id]) {
          continue;
        }

        try {
          const blob = await api.downloadFile(audioFile.id);
          const blobUrl = URL.createObjectURL(blob);
          newUrls[audioFile.id] = blobUrl;
        } catch (err) {
          console.error(`Failed to load audio ${audioFile.id}:`, err);
        }
      }

      if (Object.keys(newUrls).length > 0) {
        setAudioUrls(prev => ({ ...prev, ...newUrls }));
      }
    };

    loadAudios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, audioFileIds.join(',')]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(audioUrls).forEach(url => {
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
        if (currentIndex < audioFiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, audioFiles.length, onClose]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Update current time and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioFiles[currentIndex]?.id]);

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < audioFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !file || audioFiles.length === 0) return null;

  const currentFile = audioFiles[currentIndex];
  // Use blob URL if available, otherwise fall back to downloadUrl
  const audioUrl = audioUrls[currentFile.id] || currentFile.downloadUrl;

  return (
    <div className="audio-preview" onClick={onClose}>
      <div className="audio-preview__container" onClick={(e) => e.stopPropagation()}>
        <button className="audio-preview__close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="audio-preview__content">
          <div className="audio-preview__icon">
            <Volume2 size={64} />
          </div>
          
          <div className="audio-preview__info">
            <div className="audio-preview__name">{currentFile.name}</div>
            <div className="audio-preview__time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="audio-preview__progress-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="audio-preview__progress"
              aria-label="Seek"
            />
          </div>
        </div>

        <div className="audio-preview__controls">
          <div className="audio-preview__nav">
            <button
              className="audio-preview__button"
              onClick={(e) => handlePrevious(e)}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="audio-preview__counter">
              {currentIndex + 1} / {audioFiles.length}
            </span>
            <button
              className="audio-preview__button"
              onClick={(e) => handleNext(e)}
              disabled={currentIndex === audioFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="audio-preview__playback">
            <button className="audio-preview__button audio-preview__button--large" onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button className="audio-preview__button" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="audio-preview__volume-slider"
              aria-label="Volume"
            />
          </div>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
        />
      </div>
    </div>
  );
}

