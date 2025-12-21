import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useDragDrop } from '../../../hooks/useDragDrop';
import { useFilesStore } from '../../../store/useFilesStore';
import './_DropZone.scss';

interface DropZoneContextType {
  resetDragging: () => void;
}

const DropZoneContext = createContext<DropZoneContextType | null>(null);

export const useDropZone = () => {
  const context = useContext(DropZoneContext);
  return context;
};

interface DropZoneProps {
  children: ReactNode;
  targetId?: string;
}

export function DropZone({ children, targetId }: DropZoneProps) {
  const uploadFiles = useFilesStore((state) => state.uploadFiles);

  const { isDragging, handleDragEnter, handleDragOver, handleDragLeave, handleDrop, resetDragging } = useDragDrop({
    onDrop: (files) => {
      uploadFiles(files, targetId);
    },
  });

  const handleDropZoneDragOver = (e: React.DragEvent) => {
    // Check if we're over a FileItem - if so, let it handle the drop
    const target = e.target as HTMLElement;
    if (target.closest('.file-item')) {
      // Let FileItem handle it
      return;
    }
    // Otherwise handle it in the DropZone
    handleDragOver(e, targetId);
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    // Check if we're over a FileItem - if so, let it handle the drop but reset dragging state
    const target = e.target as HTMLElement;
    if (target.closest('.file-item')) {
      // FileItem will handle the drop, but we need to reset our dragging state
      resetDragging();
      return;
    }
    // Otherwise handle it in the DropZone
    handleDrop(e, targetId);
  };

  return (
    <DropZoneContext.Provider value={{ resetDragging }}>
      <div
        className={`drop-zone ${isDragging ? 'drop-zone--dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDropZoneDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropZoneDrop}
        onClick={resetDragging}
      >
        {children}
        {isDragging && (
          <div className="drop-zone__overlay">
            <div className="drop-zone__message">Drop files here to upload</div>
          </div>
        )}
      </div>
    </DropZoneContext.Provider>
  );
}

