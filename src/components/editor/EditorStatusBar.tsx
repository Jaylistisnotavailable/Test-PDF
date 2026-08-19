import React from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { setScale, setCurrentPage } from '@/app/store/slices/pdfSlice';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EditorStatusBar({ onFitWidth, onFitPage }: { onFitWidth?: () => void; onFitPage?: () => void }) {
  const dispatch = useAppDispatch();
  const { currentPage, totalPages, scale } = useAppSelector((s) => s.pdf);

  const zoomIn = () => dispatch(setScale(Math.min(4.0, scale + 0.25)));
  const zoomOut = () => dispatch(setScale(Math.max(0.25, scale - 0.25)));

  return (
    <footer className="h-8 flex items-center justify-between px-3 bg-editor-toolbar border-t border-border text-xs text-muted-foreground shrink-0">
      <div className="flex items-center gap-4">
        <span>Page {currentPage} of {totalPages || '--'}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dispatch(setCurrentPage(Math.max(1, currentPage - 1)))}>‹</Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dispatch(setCurrentPage(Math.min(totalPages, currentPage + 1)))}>›</Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomOut}><ZoomOut className="w-3.5 h-3.5" /></Button>
        <span className="w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomIn}><ZoomIn className="w-3.5 h-3.5" /></Button>
        <div className="w-px h-3 bg-border mx-1" />
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onFitWidth}>Fit Width</Button>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onFitPage}>Fit Page</Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dispatch(setScale(1.0))}><Maximize className="w-3.5 h-3.5" /></Button>
      </div>
    </footer>
  );
}
