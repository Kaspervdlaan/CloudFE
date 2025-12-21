import { useState, useCallback, type DragEvent } from 'react';

interface UseDragDropOptions {
  onDrop: (files: FileList, targetId?: string) => void;
  onDragOver?: (targetId?: string) => void;
  onDragLeave?: () => void;
}

export function useDragDrop({ onDrop, onDragOver, onDragLeave }: UseDragDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetId, setDragTargetId] = useState<string | undefined>();

  const handleDragEnter = useCallback((e: DragEvent) => {
    // Only handle external file drags (from OS), not internal drags
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (!hasFiles) {
      return; // Ignore internal drags
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, targetId?: string) => {
    // Only handle external file drags (from OS), not internal drags
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (!hasFiles) {
      return; // Ignore internal drags
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragTargetId(targetId);
    onDragOver?.(targetId);
  }, [onDragOver]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    // Only handle external file drags (from OS), not internal drags
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (!hasFiles) {
      return; // Ignore internal drags
    }
    
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
      setDragTargetId(undefined);
      onDragLeave?.();
    }
  }, [onDragLeave]);

  const handleDrop = useCallback((e: DragEvent, targetId?: string) => {
    // Only handle external file drags (from OS), not internal drags
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (!hasFiles) {
      return; // Ignore internal drags - they're handled by FileItem
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragTargetId(undefined);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onDrop(files, targetId);
    }
  }, [onDrop]);

  const resetDragging = useCallback(() => {
    setIsDragging(false);
    setDragTargetId(undefined);
  }, []);

  return {
    isDragging,
    dragTargetId,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resetDragging,
  };
}

