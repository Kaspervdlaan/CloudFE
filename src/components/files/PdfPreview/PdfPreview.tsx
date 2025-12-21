import { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { File } from '../../../types/file';
import { isPdfFile } from '../../../utils/fileUtils';
import { api } from '../../../utils/api';
import './_PdfPreview.scss';

interface PdfPreviewProps {
  isOpen: boolean;
  file: File | null;
  files: File[];
  onClose: () => void;
}

export function PdfPreview({ isOpen, file, files, onClose }: PdfPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pdfFiles = files.filter(f => isPdfFile(f));
  const pdfFileIds = useMemo(() => pdfFiles.map(f => f.id), [pdfFiles]);

  // Only set index when the file prop changes (initial open), not when navigating
  useEffect(() => {
    if (file && isPdfFile(file) && isOpen) {
      const index = pdfFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [file?.id, isOpen, pdfFiles]);

  useEffect(() => {
    if (!isOpen) {
      // Clean up blob URLs when preview closes
      setPdfUrls(prev => {
        Object.values(prev).forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        return {};
      });
      setLoading({});
      setErrors({});
    }
  }, [isOpen]);

  // Fetch PDF files and create blob URLs
  useEffect(() => {
    if (!isOpen || pdfFiles.length === 0) return;

    const loadPdfs = async () => {
      for (const pdfFile of pdfFiles) {
        // Skip if already loaded or loading
        if (pdfUrls[pdfFile.id] || loading[pdfFile.id]) {
          continue;
        }

        setLoading(prev => ({ ...prev, [pdfFile.id]: true }));

        try {
          const blob = await api.downloadFile(pdfFile.id);
          const blobUrl = URL.createObjectURL(blob);
          setPdfUrls(prev => ({ ...prev, [pdfFile.id]: blobUrl }));
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[pdfFile.id];
            return newErrors;
          });
        } catch (err) {
          console.error(`Failed to load PDF ${pdfFile.id}:`, err);
          setErrors(prev => ({
            ...prev,
            [pdfFile.id]: 'Failed to load PDF file.',
          }));
        } finally {
          setLoading(prev => {
            const newLoading = { ...prev };
            delete newLoading[pdfFile.id];
            return newLoading;
          });
        }
      }
    };

    loadPdfs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pdfFileIds.join(',')]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(pdfUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [pdfUrls]);

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
        if (currentIndex < pdfFiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, pdfFiles.length, onClose]);

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < pdfFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!isOpen || !file || pdfFiles.length === 0) return null;

  const currentFile = pdfFiles[currentIndex];
  const pdfUrl = pdfUrls[currentFile.id];
  const isLoading = loading[currentFile.id];
  const error = errors[currentFile.id];

  return (
    <div className="pdf-preview" onClick={onClose}>
      <div className="pdf-preview__container" onClick={(e) => e.stopPropagation()}>
        <button className="pdf-preview__close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="pdf-preview__content-container">
          {isLoading ? (
            <div className="pdf-preview__loading">Loading PDF...</div>
          ) : error ? (
            <div className="pdf-preview__error">{error}</div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="pdf-preview__iframe"
              title={currentFile.name}
            />
          ) : (
            <div className="pdf-preview__loading">Loading PDF...</div>
          )}
        </div>

        <div className="pdf-preview__controls">
          <div className="pdf-preview__nav">
            <button
              className="pdf-preview__button"
              onClick={(e) => handlePrevious(e)}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="pdf-preview__counter">
              {currentIndex + 1} / {pdfFiles.length}
            </span>
            <button
              className="pdf-preview__button"
              onClick={(e) => handleNext(e)}
              disabled={currentIndex === pdfFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="pdf-preview__info">
          <div className="pdf-preview__name">{currentFile.name}</div>
        </div>
      </div>
    </div>
  );
}

