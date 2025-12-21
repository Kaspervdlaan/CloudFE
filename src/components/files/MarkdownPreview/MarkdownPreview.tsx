import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { File } from '../../../types/file';
import { isMarkdownFile } from '../../../utils/fileUtils';
import { api } from '../../../utils/api';
import './_MarkdownPreview.scss';

interface MarkdownPreviewProps {
  isOpen: boolean;
  file: File | null;
  files: File[];
  onClose: () => void;
}

const MAX_PREVIEW_SIZE = 10 * 1024 * 1024; // 10MB limit for preview

// Simple markdown to HTML converter (basic implementation)
function markdownToHtml(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
    return '<p>Empty file</p>';
  }

  // Split into lines for better processing
  const lines = markdown.split('\n');
  const htmlLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        htmlLines.push(`<pre><code>${codeBlockContent.join('\n')}</code></pre>`);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // Process regular markdown
    let processed = line;
    
    // Headers
    if (line.match(/^### /)) {
      processed = `<h3>${line.replace(/^### /, '')}</h3>`;
    } else if (line.match(/^## /)) {
      processed = `<h2>${line.replace(/^## /, '')}</h2>`;
    } else if (line.match(/^# /)) {
      processed = `<h1>${line.replace(/^# /, '')}</h1>`;
    } else {
      // Bold (must come before italic)
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');
      // Italic (single asterisk/underscore, avoid matching inside code blocks)
      processed = processed.replace(/(^|[^*])\*([^*]+?)\*([^*]|$)/g, '$1<em>$2</em>$3');
      processed = processed.replace(/(^|[^_])_([^_]+?)_([^_]|$)/g, '$1<em>$2</em>$3');
      // Inline code
      processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
      // Links
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // Wrap in paragraph if not empty
      if (processed.trim()) {
        processed = `<p>${processed}</p>`;
      }
    }
    
    htmlLines.push(processed);
  }
  
  // Handle unclosed code block
  if (inCodeBlock && codeBlockContent.length > 0) {
    htmlLines.push(`<pre><code>${codeBlockContent.join('\n')}</code></pre>`);
  }
  
  let html = htmlLines.join('\n');
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><h/g, '<h');
  html = html.replace(/<\/h([1-6])><\/p>/g, '</h$1>');
  
  return html;
}

export function MarkdownPreview({ isOpen, file, files, onClose }: MarkdownPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [markdownContent, setMarkdownContent] = useState<Record<string, string>>({});
  const [htmlContent, setHtmlContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const markdownFiles = files.filter(f => isMarkdownFile(f));
  const markdownFileIds = useMemo(() => markdownFiles.map(f => f.id), [markdownFiles]);

  // Only set index when the preview first opens, not when navigating
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (file && isOpen && !hasInitialized.current) {
      const isMarkdown = isMarkdownFile(file);
      if (isMarkdown && markdownFiles.length > 0) {
        const index = markdownFiles.findIndex(f => f.id === file.id);
        if (index !== -1) {
          setCurrentIndex(index);
          hasInitialized.current = true;
        }
      }
    }
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [file?.id, isOpen, markdownFiles]);

  useEffect(() => {
    if (!isOpen) {
      // Clear content when preview closes
      setMarkdownContent({});
      setHtmlContent({});
      setLoading({});
      setErrors({});
    }
  }, [isOpen]);

  // Fetch markdown files and convert to HTML
  useEffect(() => {
    if (!isOpen || markdownFiles.length === 0) return;

    const loadMarkdown = async () => {
      for (const mdFile of markdownFiles) {
        // Skip if already loaded or loading
        if (markdownContent[mdFile.id] || loading[mdFile.id]) {
          continue;
        }

        // Check file size
        if (mdFile.size && mdFile.size > MAX_PREVIEW_SIZE) {
          const sizeMB = Math.round(mdFile.size / 1024 / 1024);
          setErrors(prev => ({
            ...prev,
            [mdFile.id]: `File is too large to preview (${sizeMB}MB). Maximum preview size is 10MB.`,
          }));
          continue;
        }

        setLoading(prev => ({ ...prev, [mdFile.id]: true }));

        try {
          const blob = await api.downloadFile(mdFile.id);
          const text = await blob.text();
          const html = markdownToHtml(text);
          setMarkdownContent(prev => ({ ...prev, [mdFile.id]: text }));
          setHtmlContent(prev => ({ ...prev, [mdFile.id]: html }));
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[mdFile.id];
            return newErrors;
          });
        } catch (err) {
          console.error(`Failed to load markdown file ${mdFile.id}:`, err);
          setErrors(prev => ({
            ...prev,
            [mdFile.id]: 'Failed to load file content.',
          }));
        } finally {
          setLoading(prev => {
            const newLoading = { ...prev };
            delete newLoading[mdFile.id];
            return newLoading;
          });
        }
      }
    };

    loadMarkdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, markdownFileIds.join(',')]);

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
        if (currentIndex < markdownFiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, markdownFiles.length, onClose]);

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < markdownFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!isOpen) {
    return null;
  }
  
  if (markdownFiles.length === 0) {
    return null;
  }

  // Ensure currentIndex is within bounds
  const safeIndex = Math.max(0, Math.min(currentIndex, markdownFiles.length - 1));
  const currentFile = markdownFiles[safeIndex];
  const content = htmlContent[currentFile.id];
  const isLoading = loading[currentFile.id];
  const error = errors[currentFile.id];

  return (
    <div className="markdown-preview" onClick={onClose}>
      <div className="markdown-preview__container" onClick={(e) => e.stopPropagation()}>
        <button className="markdown-preview__close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="markdown-preview__content-container">
          {isLoading ? (
            <div className="markdown-preview__loading">Loading...</div>
          ) : error ? (
            <div className="markdown-preview__error">{error}</div>
          ) : content ? (
            <div 
              className="markdown-preview__content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="markdown-preview__loading">Loading...</div>
          )}
        </div>

        <div className="markdown-preview__controls">
          <div className="markdown-preview__nav">
            <button
              className="markdown-preview__button"
              onClick={(e) => handlePrevious(e)}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="markdown-preview__counter">
              {currentIndex + 1} / {markdownFiles.length}
            </span>
            <button
              className="markdown-preview__button"
              onClick={(e) => handleNext(e)}
              disabled={currentIndex === markdownFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="markdown-preview__info">
          <div className="markdown-preview__name">{currentFile.name}</div>
        </div>
      </div>
    </div>
  );
}

