import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: 'left' | 'right';
  isOpen: boolean;
}

export function ResizablePanel({ 
  children, 
  defaultWidth = 280, 
  minWidth = 200, 
  maxWidth = 400, 
  side = 'left',
  isOpen
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = side === 'left' ? e.clientX : window.innerWidth - e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  }, [minWidth, maxWidth, side]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div 
      className="relative flex-shrink-0 h-full bg-editor-sidebar border-r border-border transition-all duration-200"
      style={{ width: isOpen ? width : 0, minWidth: isOpen ? minWidth : 0 }}
    >
      {children}
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/50 transition-colors ${side === 'left' ? '-right-0.5' : '-left-0.5'}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}