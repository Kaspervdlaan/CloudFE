import { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { File } from '../../../types/file';
import { isOfficeFile } from '../../../utils/fileUtils';
import { api } from '../../../utils/api';
import './_DocumentPreview.scss';

interface DocumentPreviewProps {
  isOpen: boolean;
  file: File | null;
  files: File[];
  onClose: () => void;
}

export function DocumentPreview({ isOpen, file, files, onClose }: DocumentPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const documentFiles = files.filter(f => isOfficeFile(f));
  const documentFileIds = useMemo(() => documentFiles.map(f => f.id), [documentFiles]);

  // Only set index when the file prop changes (initial open), not when navigating
  useEffect(() => {
    if (file && isOfficeFile(file) && isOpen) {
      const index = documentFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [file?.id, isOpen, documentFiles]);

  useEffect(() => {
    if (!isOpen) {
      // Clean up blob URLs when preview closes
      setDocumentUrls(prev => {
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

  // Fetch document files and create blob URLs
  useEffect(() => {
    if (!isOpen || documentFiles.length === 0) return;

    const loadDocuments = async () => {
      for (const docFile of documentFiles) {
        // Skip if already loaded or loading
        if (documentUrls[docFile.id] || loading[docFile.id]) {
          continue;
        }

        setLoading(prev => ({ ...prev, [docFile.id]: true }));

        try {
          const blob = await api.downloadFile(docFile.id);
          const blobUrl = URL.createObjectURL(blob);
          setDocumentUrls(prev => ({ ...prev, [docFile.id]: blobUrl }));
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[docFile.id];
            return newErrors;
          });
        } catch (err) {
          console.error(`Failed to load document ${docFile.id}:`, err);
          setErrors(prev => ({
            ...prev,
            [docFile.id]: 'Failed to load document file.',
          }));
        } finally {
          setLoading(prev => {
            const newLoading = { ...prev };
            delete newLoading[docFile.id];
            return newLoading;
          });
        }
      }
    };

    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, documentFileIds.join(',')]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(documentUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [documentUrls]);

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
        if (currentIndex < documentFiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, documentFiles.length, onClose]);

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < documentFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    const currentFile = documentFiles[currentIndex];
    if (currentFile) {
      try {
        const blob = await api.downloadFile(currentFile.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to download file:', err);
      }
    }
  };

  if (!isOpen || !file || documentFiles.length === 0) return null;

  const currentFile = documentFiles[currentIndex];
  const isLoading = loading[currentFile.id];
  const error = errors[currentFile.id];

  // Office documents (DOCX, XLSX, PPTX) cannot be displayed directly in browser iframes
  // Browsers will download them instead. We'll show a download option.
  // Note: For future enhancement, we could convert to PDF on the backend or use Office Online Viewer

  return (
    <div className="document-preview" onClick={onClose}>
      <div className="document-preview__container" onClick={(e) => e.stopPropagation()}>
        <button className="document-preview__close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="document-preview__content-container">
          {isLoading ? (
            <div className="document-preview__loading">Loading document...</div>
          ) : error ? (
            <div className="document-preview__error">{error}</div>
          ) : (
            <div className="document-preview__unsupported">
              <div className="document-preview__unsupported-message">
                <h3>Office Document Preview</h3>
                <p>Office documents (Word, Excel, PowerPoint) cannot be previewed directly in the browser.</p>
                <p>Please download the file to view it with Microsoft Office, Google Docs, or another compatible application.</p>
                <button 
                  className="document-preview__download-button"
                  onClick={handleDownload}
                >
                  <Download size={20} />
                  <span>Download {currentFile.name}</span>
                </button>
                <div className="document-preview__info-text">
                  <p><strong>File:</strong> {currentFile.name}</p>
                  {currentFile.size && (
                    <p><strong>Size:</strong> {(currentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="document-preview__controls">
          <div className="document-preview__nav">
            <button
              className="document-preview__button"
              onClick={(e) => handlePrevious(e)}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="document-preview__counter">
              {currentIndex + 1} / {documentFiles.length}
            </span>
            <button
              className="document-preview__button"
              onClick={(e) => handleNext(e)}
              disabled={currentIndex === documentFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="document-preview__info">
          <div className="document-preview__name">{currentFile.name}</div>
        </div>
      </div>
    </div>
  );
}

