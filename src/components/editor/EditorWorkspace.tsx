// import React, { useRef, useState } from 'react';
// import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
// import { toggleLeftPanel, toggleRightPanel } from '@/app/store/slices/uiSlice';
// import { ResizablePanel } from '@/components/layout/ResizablePanel';
// import { PageSidebar } from '@/features/page-sidebar/PageSidebar';
// import { PdfViewer } from '@/features/pdf-viewer/PdfViewer';
// import { InspectorPanel } from './InspectorPanel';
// import { ContextToolbar } from './ContextToolbar';
// import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

// export function EditorWorkspace({ viewerRef }: { viewerRef: React.RefObject<{ handleFitWidth: () => void; handleFitPage: () => void }> }) {
//   const dispatch = useAppDispatch();
//   const leftPanelOpen = useAppSelector((s) => s.ui.leftPanelOpen);
//   const rightPanelOpen = useAppSelector((s) => s.ui.rightPanelOpen);
  
//   const pdfViewerRef = useRef<{ handleFitWidth: () => void; handleFitPage: () => void }>(null);

//   return (
//     <div className="flex flex-1 overflow-hidden relative bg-editor-workspace">
//       <ResizablePanel isOpen={leftPanelOpen} defaultWidth={280} minWidth={240} maxWidth={400} side="left">
//         <PageSidebar />
//       </ResizablePanel>

//       <button
//         onClick={() => dispatch(toggleLeftPanel())}
//         className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-5 h-12 bg-editor-panel border border-border rounded-r-md shadow-sm flex items-center justify-center hover:bg-editor-hover transition-all"
//         style={{ left: leftPanelOpen ? 280 : 0 }}
//         title={leftPanelOpen ? "Collapse Sidebar" : "Expand Sidebar"}
//       >
//         {leftPanelOpen ? <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" /> : <PanelLeftOpen className="w-3.5 h-3.5 text-muted-foreground" />}
//       </button>

//       <div className="flex-1 relative flex flex-col min-w-0">
//         <ContextToolbar />
//         <PdfViewer ref={viewerRef} />
//       </div>

//       <button
//         onClick={() => dispatch(toggleRightPanel())}
//         className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-5 h-12 bg-editor-panel border border-border rounded-l-md shadow-sm flex items-center justify-center hover:bg-editor-hover transition-all"
//         style={{ right: rightPanelOpen ? 280 : 0 }}
//         title={rightPanelOpen ? "Collapse Inspector" : "Expand Inspector"}
//       >
//         {rightPanelOpen ? <PanelRightClose className="w-3.5 h-3.5 text-muted-foreground" /> : <PanelRightOpen className="w-3.5 h-3.5 text-muted-foreground" />}
//       </button>

//       <ResizablePanel isOpen={rightPanelOpen} defaultWidth={280} minWidth={240} maxWidth={400} side="right">
//         <InspectorPanel />
//       </ResizablePanel>
//     </div>
//   );
// }


import React, {
  useRef,
} from 'react';

import {
  useAppSelector,
  useAppDispatch,
} from '@/app/store/hooks';

import {
  toggleLeftPanel,
  toggleRightPanel,
} from '@/app/store/slices/uiSlice';

import {
  ResizablePanel,
} from '@/components/layout/ResizablePanel';

import {
  PageSidebar,
} from '@/features/page-sidebar/PageSidebar';

import {
  PdfViewer,
} from '@/features/pdf-viewer/PdfViewer';

import {
  InspectorPanel,
} from './InspectorPanel';

import {
  ContextToolbar,
} from './ContextToolbar';


export function EditorWorkspace({
  viewerRef,
}: {
  viewerRef: React.RefObject<{
    handleFitWidth: () => void;
    handleFitPage: () => void;
  }>;
}) {
  const dispatch = useAppDispatch();

  const leftPanelOpen =
    useAppSelector(
      (state) => state.ui.leftPanelOpen,
    );

  const rightPanelOpen =
    useAppSelector(
      (state) => state.ui.rightPanelOpen,
    );

  /**
   * Kept for compatibility with the existing component
   * structure.
   *
   * The actual PdfViewer continues to receive the viewerRef
   * supplied by EditorShell.
   */
  const pdfViewerRef =
    useRef<{
      handleFitWidth: () => void;
      handleFitPage: () => void;
    }>(null);

  return (
    <div
      data-editor-workspace="true"
      className="
        relative
        flex
        flex-1
        min-w-0
        min-h-0
        overflow-hidden
        bg-editor-workspace
      "
    >

      {/* =====================================================
          LEFT PANEL
          ===================================================== */}

      <ResizablePanel
        isOpen={leftPanelOpen}
        defaultWidth={280}
        minWidth={240}
        maxWidth={400}
        side="left"
        storageKey="test-pdf:left-panel-width"
        onCollapse={() => {
          if (leftPanelOpen) {
            dispatch(toggleLeftPanel());
          }
        }}
        onExpand={() => {
          if (!leftPanelOpen) {
            dispatch(toggleLeftPanel());
          }
        }}
      >
        <PageSidebar />
      </ResizablePanel>


      {/* =====================================================
          MAIN PDF WORKSPACE
          ===================================================== */}

      <div
        className="
          relative
          flex
          flex-1
          flex-col
          min-w-0
          min-h-0
          overflow-hidden
        "
      >
        <ContextToolbar />

        <div
          className="
            relative
            flex-1
            min-w-0
            min-h-0
            overflow-hidden
          "
        >
          <PdfViewer
            ref={viewerRef}
          />
        </div>
      </div>


      {/* =====================================================
          RIGHT PANEL
          ===================================================== */}

      <ResizablePanel
        isOpen={rightPanelOpen}
        defaultWidth={280}
        minWidth={240}
        maxWidth={400}
        side="right"
        storageKey="test-pdf:right-panel-width"
        onCollapse={() => {
          if (rightPanelOpen) {
            dispatch(toggleRightPanel());
          }
        }}
        onExpand={() => {
          if (!rightPanelOpen) {
            dispatch(toggleRightPanel());
          }
        }}
      >
        <InspectorPanel />
      </ResizablePanel>

    </div>
  );
}