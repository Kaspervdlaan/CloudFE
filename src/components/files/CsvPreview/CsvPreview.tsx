import { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { File } from '../../../types/file';
import { isCsvFile } from '../../../utils/fileUtils';
import { api } from '../../../utils/api';
import './_CsvPreview.scss';

interface CsvPreviewProps {
  isOpen: boolean;
  file: File | null;
  files: File[];
  onClose: () => void;
}

const MAX_PREVIEW_SIZE = 10 * 1024 * 1024; // 10MB limit for preview
const MAX_ROWS_PREVIEW = 1000; // Maximum rows to display

// Simple CSV parser
function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of cell
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n after \r
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.length > 0 && currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  // Add last cell and row
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.length > 0 && currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function CsvPreview({ isOpen, file, files, onClose }: CsvPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [csvData, setCsvData] = useState<Record<string, string[][]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const csvFiles = files.filter(f => isCsvFile(f));
  const csvFileIds = useMemo(() => csvFiles.map(f => f.id), [csvFiles]);

  // Only set index when the file prop changes (initial open), not when navigating
  useEffect(() => {
    if (file && isCsvFile(file) && isOpen) {
      const index = csvFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [file?.id, isOpen, csvFiles]);

  useEffect(() => {
    if (!isOpen) {
      // Clear content when preview closes
      setCsvData({});
      setLoading({});
      setErrors({});
    }
  }, [isOpen]);

  // Fetch CSV files and parse them
  useEffect(() => {
    if (!isOpen || csvFiles.length === 0) return;

    const loadCsv = async () => {
      for (const csvFile of csvFiles) {
        // Skip if already loaded or loading
        if (csvData[csvFile.id] || loading[csvFile.id]) {
          continue;
        }

        // Check file size
        if (csvFile.size && csvFile.size > MAX_PREVIEW_SIZE) {
          const sizeMB = Math.round(csvFile.size / 1024 / 1024);
          setErrors(prev => ({
            ...prev,
            [csvFile.id]: `File is too large to preview (${sizeMB}MB). Maximum preview size is 10MB.`,
          }));
          continue;
        }

        setLoading(prev => ({ ...prev, [csvFile.id]: true }));

        try {
          const blob = await api.downloadFile(csvFile.id);
          const text = await blob.text();
          const parsed = parseCsv(text);
          
          // Limit rows for preview
          const limitedData = parsed.slice(0, MAX_ROWS_PREVIEW);
          const hasMore = parsed.length > MAX_ROWS_PREVIEW;
          
          setCsvData(prev => ({ ...prev, [csvFile.id]: limitedData }));
          
          if (hasMore) {
            setErrors(prev => ({
              ...prev,
              [csvFile.id]: `Showing first ${MAX_ROWS_PREVIEW} rows of ${parsed.length} total rows.`,
            }));
          } else {
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[csvFile.id];
              return newErrors;
            });
          }
        } catch (err) {
          console.error(`Failed to load CSV file ${csvFile.id}:`, err);
          setErrors(prev => ({
            ...prev,
            [csvFile.id]: 'Failed to load file content.',
          }));
        } finally {
          setLoading(prev => {
            const newLoading = { ...prev };
            delete newLoading[csvFile.id];
            return newLoading;
          });
        }
      }
    };

    loadCsv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, csvFileIds.join(',')]);

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
        if (currentIndex < csvFiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, csvFiles.length, onClose]);

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < csvFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!isOpen || !file || csvFiles.length === 0) return null;

  const currentFile = csvFiles[currentIndex];
  const data = csvData[currentFile.id];
  const isLoading = loading[currentFile.id];
  const error = errors[currentFile.id];
  const isWarning = error && error.includes('Showing first');

  return (
    <div className="csv-preview" onClick={onClose}>
      <div className="csv-preview__container" onClick={(e) => e.stopPropagation()}>
        <button className="csv-preview__close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="csv-preview__content-container">
          {isLoading ? (
            <div className="csv-preview__loading">Loading CSV...</div>
          ) : error && !isWarning ? (
            <div className="csv-preview__error">{error}</div>
          ) : data && data.length > 0 ? (
            <>
              {isWarning && (
                <div className="csv-preview__warning">{error}</div>
              )}
              <div className="csv-preview__table-wrapper">
                <table className="csv-preview__table">
                  <thead>
                    <tr>
                      {data[0].map((header, idx) => (
                        <th key={idx}>{header || `Column ${idx + 1}`}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {data[0].map((_, colIdx) => (
                          <td key={colIdx}>{row[colIdx] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="csv-preview__loading">Loading CSV...</div>
          )}
        </div>

        <div className="csv-preview__controls">
          <div className="csv-preview__nav">
            <button
              className="csv-preview__button"
              onClick={(e) => handlePrevious(e)}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="csv-preview__counter">
              {currentIndex + 1} / {csvFiles.length}
            </span>
            <button
              className="csv-preview__button"
              onClick={(e) => handleNext(e)}
              disabled={currentIndex === csvFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="csv-preview__info">
          <div className="csv-preview__name">{currentFile.name}</div>
        </div>
      </div>
    </div>
  );
}

