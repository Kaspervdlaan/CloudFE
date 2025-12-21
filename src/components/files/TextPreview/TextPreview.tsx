import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { File } from '../../../types/file';
import { isTextFile, isCodeFile } from '../../../utils/fileUtils';
import { api } from '../../../utils/api';
import './_TextPreview.scss';

interface TextPreviewProps {
  isOpen: boolean;
  file: File | null;
  files: File[];
  onClose: () => void;
}

const MAX_PREVIEW_SIZE = 10 * 1024 * 1024; // 10MB limit for preview

export function TextPreview({ isOpen, file, files, onClose }: TextPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textContent, setTextContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Include both text files and code files in the preview
  const textFiles = files.filter(f => isTextFile(f) || isCodeFile(f));
  const textFileIds = useMemo(() => textFiles.map(f => f.id), [textFiles]);

  // Only set index when the preview first opens, not when navigating
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (file && isOpen && !hasInitialized.current) {
      const isText = isTextFile(file) || isCodeFile(file);
      if (isText && textFiles.length > 0) {
        const index = textFiles.findIndex(f => f.id === file.id);
        if (index !== -1) {
          setCurrentIndex(index);
          hasInitialized.current = true;
        }
      }
    }
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [file?.id, isOpen, textFiles]);

  useEffect(() => {
    if (!isOpen) {
      // Clear content when preview closes
      setTextContent({});
      setLoading({});
      setErrors({});
    }
  }, [isOpen]);

  // Fetch text files and convert to text
  useEffect(() => {
    if (!isOpen || textFiles.length === 0) return;

    const loadText = async () => {
      for (const textFile of textFiles) {
        // Skip if already loaded or loading
        if (textContent[textFile.id] || loading[textFile.id]) {
          continue;
        }

        // Check file size
        if (textFile.size && textFile.size > MAX_PREVIEW_SIZE) {
          const sizeMB = Math.round(textFile.size / 1024 / 1024);
          setErrors(prev => ({
            ...prev,
            [textFile.id]: `File is too large to preview (${sizeMB}MB). Maximum preview size is 10MB.`,
          }));
          continue;
        }

        setLoading(prev => ({ ...prev, [textFile.id]: true }));

        try {
          const blob = await api.downloadFile(textFile.id);
          const text = await blob.text();
          setTextContent(prev => ({ ...prev, [textFile.id]: text }));
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[textFile.id];
            return newErrors;
          });
        } catch (err) {
          console.error(`Failed to load text file ${textFile.id}:`, err);
          setErrors(prev => ({
            ...prev,
            [textFile.id]: 'Failed to load file content.',
          }));
        } finally {
          setLoading(prev => {
            const newLoading = { ...prev };
            delete newLoading[textFile.id];
            return newLoading;
          });
        }
      }
    };

    loadText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, textFileIds.join(',')]);

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
        if (currentIndex < textFiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, textFiles.length, onClose]);

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < textFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!isOpen) {
    return null;
  }
  
  if (textFiles.length === 0) {
    return null;
  }

  // Ensure currentIndex is within bounds
  const safeIndex = Math.max(0, Math.min(currentIndex, textFiles.length - 1));
  const currentFile = textFiles[safeIndex];
  const content = textContent[currentFile.id];
  const isLoading = loading[currentFile.id];
  const error = errors[currentFile.id];

  return (
    <div className="text-preview" onClick={onClose}>
      <div className="text-preview__container" onClick={(e) => e.stopPropagation()}>
        <button className="text-preview__close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="text-preview__content-container">
          {isLoading ? (
            <div className="text-preview__loading">Loading...</div>
          ) : error ? (
            <div className="text-preview__error">{error}</div>
          ) : content ? (
            <pre className="text-preview__text">
              <code>{content}</code>
            </pre>
          ) : (
            <div className="text-preview__loading">Loading...</div>
          )}
        </div>

        <div className="text-preview__controls">
          <div className="text-preview__nav">
            <button
              className="text-preview__button"
              onClick={(e) => handlePrevious(e)}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-preview__counter">
              {currentIndex + 1} / {textFiles.length}
            </span>
            <button
              className="text-preview__button"
              onClick={(e) => handleNext(e)}
              disabled={currentIndex === textFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="text-preview__info">
          <div className="text-preview__name">{currentFile.name}</div>
        </div>
      </div>
    </div>
  );
}


