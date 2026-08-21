import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: 'left' | 'right';
  /**
   * Controlled open state from Redux.
   */
  isOpen: boolean;
  /**
   * Called when the panel is dragged to the edge.
   */
  onCollapse?: () => void;
  /**
   * Called when the collapsed edge zone is clicked.
   */
  onExpand?: () => void;
  /**
   * Persist panel width between page reloads.
   */
  storageKey?: string;
}

const COLLAPSE_THRESHOLD = 30;
const EDGE_ZONE_WIDTH = 8;

export function ResizablePanel({
  children,
  defaultWidth = 280,
  minWidth = 240,
  maxWidth = 400,
  side = 'left',
  isOpen,
  onCollapse,
  onExpand,
  storageKey,
}: ResizablePanelProps) {
  const [width, setWidth] = useState<number>(() => {
    if (!storageKey) {
      return defaultWidth;
    }
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        return defaultWidth;
      }
      const parsed = Number(saved);
      if (!Number.isFinite(parsed)) {
        return defaultWidth;
      }
      return Math.min(
        maxWidth,
        Math.max(minWidth, parsed),
      );
    } catch {
      return defaultWidth;
    }
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringDivider, setIsHoveringDivider] = useState(false);
  const isResizingRef = useRef(false);
  const collapsePendingRef = useRef(false);

  /**
   * Save the last usable panel width.
   */
  useEffect(() => {
    if (!storageKey || !isOpen) {
      return;
    }
    try {
      window.localStorage.setItem(
        storageKey,
        String(Math.round(width)),
      );
    } catch {
      // localStorage may be unavailable.
    }
  }, [storageKey, width, isOpen]);

  /**
   * Make sure the current width remains inside the allowed range.
   */
  useEffect(() => {
    setWidth((current) =>
      Math.min(
        maxWidth,
        Math.max(minWidth, current),
      ),
    );
  }, [minWidth, maxWidth]);

  /**
   * Start resizing.
   */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isOpen) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      isResizingRef.current = true;
      setIsResizing(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is not supported everywhere.
      }
    },
    [isOpen],
  );

  /**
   * Handle resize.
   */
  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!isResizingRef.current) {
        return;
      }
      const workspaceElement = document.querySelector(
        '[data-editor-workspace="true"]',
      );
      if (!workspaceElement) {
        return;
      }
      const workspaceRect = workspaceElement.getBoundingClientRect();
      let newWidth: number;
      if (side === 'left') {
        newWidth = event.clientX - workspaceRect.left;
      } else {
        newWidth = workspaceRect.right - event.clientX;
      }

      if (newWidth <= COLLAPSE_THRESHOLD) {
        collapsePendingRef.current = true;
        setWidth(minWidth);
        return;
      }

      collapsePendingRef.current = false;

      const nextWidth = Math.min(
        maxWidth,
        Math.max(minWidth, newWidth),
      );
      setWidth(nextWidth);
    },
    [maxWidth, minWidth, side],
  );

  /**
   * Finish resizing.
   */
  const handlePointerUp = useCallback(() => {
    if (!isResizingRef.current) {
      return;
    }
    const shouldCollapse = collapsePendingRef.current;

    isResizingRef.current = false;
    collapsePendingRef.current = false;
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (shouldCollapse) {
      requestAnimationFrame(() => {
        onCollapse?.();
      });
    }
  }, [onCollapse]);

  /**
   * Global pointer listeners.
   */
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handlePointerMove, handlePointerUp]);

  /**
   * Double-clicking the divider collapses the panel.
   */
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (isOpen) {
        onCollapse?.();
      }
    },
    [isOpen, onCollapse],
  );

  /**
   * ============================================================
   * COLLAPSED STATE
   * ============================================================
   */
  if (!isOpen) {
    return (
      <div
        className="absolute top-0 bottom-0 z-50 group"
        style={{
          width: EDGE_ZONE_WIDTH,
          left: side === 'left' ? 0 : undefined,
          right: side === 'right' ? 0 : undefined,
        }}
        onClick={() => {
          onExpand?.();
        }}
        onMouseEnter={() => {
          setIsHoveringDivider(true);
        }}
        onMouseLeave={() => {
          setIsHoveringDivider(false);
        }}
        title={side === 'left' ? 'Restore left panel' : 'Restore right panel'}
      >
        {/* Edge hover line: 默认淡蓝，hover时变明显 */}
        <div
          className={`
            absolute top-0 bottom-0 w-[2px] transition-all duration-200
            ${side === 'left' ? 'left-0' : 'right-0'}
            ${isHoveringDivider ? 'bg-blue-500/70' : 'bg-blue-500/30'}
          `}
        />
        {/* Small VS Code-like grip */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2
            ${side === 'left' ? 'left-0' : 'right-0'}
            h-10 w-[3px] rounded-full bg-blue-500/50 transition-opacity
            ${isHoveringDivider ? 'opacity-100' : 'opacity-0'}
          `}
        />
      </div>
    );
  }

  /**
   * ============================================================
   * OPEN STATE
   * ============================================================
   */
  return (
    <div
      className="relative flex flex-shrink-0 h-full bg-editor-sidebar overflow-hidden border-border"
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        borderRight: side === 'left' ? '1px solid var(--border)' : undefined,
        borderLeft: side === 'right' ? '1px solid var(--border)' : undefined,
      }}
    >
      {/* ======================================================
          PANEL CONTENT
      ====================================================== */}
      <div className="relative w-full h-full min-w-0 min-h-0">
        {children}
      </div>

      {/* ======================================================
          RESIZE DIVIDER (VS Code Style)
      ====================================================== */}
      <div
        className={`
          absolute top-0 bottom-0 z-40 
          w-5 cursor-col-resize touch-none
          ${side === 'left' ? 'right-[-10px]' : 'left-[-10px]'}
        `}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => {
          setIsHoveringDivider(true);
        }}
        onMouseLeave={() => {
          setIsHoveringDivider(false);
        }}
      >
        {/* Visible divider: 完美居中，默认宽且淡，hover时变宽变亮 */}
        <div
          className={`
            absolute top-0 bottom-0 transition-all duration-200 ease-in-out
            ${side === 'left' ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'}
            ${isResizing || isHoveringDivider 
              ? 'w-1 bg-blue-500/70' 
              : 'w-[2px] bg-blue-500/30'}
          `}
        />

        {/* Small drag grip: 背景完全透明，让蓝线连续贯穿，不会被打断 */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2
            flex flex-col items-center justify-center gap-[4px]
            w-[14px] py-4 rounded-sm bg-transparent
            transition-opacity duration-200
            ${isResizing || isHoveringDivider ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <span className="w-[3px] h-[3px] rounded-full bg-blue-500/60" />
          <span className="w-[3px] h-[3px] rounded-full bg-blue-500/60" />
          <span className="w-[3px] h-[3px] rounded-full bg-blue-500/60" />
          <span className="w-[3px] h-[3px] rounded-full bg-blue-500/60" />
          <span className="w-[3px] h-[3px] rounded-full bg-blue-500/60" />
        </div>
      </div>
    </div>
  );
}