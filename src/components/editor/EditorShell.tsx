import React, { useRef } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PdfProvider } from '@/features/pdf-viewer/usePdfDocument'; // 👈 引入 Provider
import { AppHeader } from './AppHeader';
import { EditorToolbar } from './EditorToolbar';
import { EditorWorkspace } from './EditorWorkspace';
import { EditorStatusBar } from './EditorStatusBar';

export function EditorShell() {
  const pdfViewerRef = useRef<{ handleFitWidth: () => void; handleFitPage: () => void }>(null);

  return (
    <TooltipProvider>
      {/* 👇 包裹整个应用，确保 Sidebar 和 PdfViewer 共享同一个 document 实例 */}
      <PdfProvider>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-editor-background text-foreground font-sans">
          <AppHeader />
          <EditorToolbar />
          <EditorWorkspace viewerRef={pdfViewerRef} />
          <EditorStatusBar 
            onFitWidth={() => pdfViewerRef.current?.handleFitWidth()} 
            onFitPage={() => pdfViewerRef.current?.handleFitPage()} 
          />
        </div>
      </PdfProvider>
    </TooltipProvider>
  );
}