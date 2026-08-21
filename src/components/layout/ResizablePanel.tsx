// import React, { useState, useCallback, useRef, useEffect } from 'react';

// interface ResizablePanelProps {
//   children: React.ReactNode;
//   defaultWidth?: number;
//   minWidth?: number;
//   maxWidth?: number;
//   side?: 'left' | 'right';
//   isOpen: boolean;
// }

// export function ResizablePanel({ 
//   children, 
//   defaultWidth = 280, 
//   minWidth = 200, 
//   maxWidth = 400, 
//   side = 'left',
//   isOpen
// }: ResizablePanelProps) {
//   const [width, setWidth] = useState(defaultWidth);
//   const isResizing = useRef(false);

//   const handleMouseDown = useCallback((e: React.MouseEvent) => {
//     e.preventDefault();
//     isResizing.current = true;
//     document.body.style.cursor = 'col-resize';
//     document.body.style.userSelect = 'none';
//   }, []);

//   const handleMouseMove = useCallback((e: MouseEvent) => {
//     if (!isResizing.current) return;
//     const newWidth = side === 'left' ? e.clientX : window.innerWidth - e.clientX;
//     if (newWidth >= minWidth && newWidth <= maxWidth) {
//       setWidth(newWidth);
//     }
//   }, [minWidth, maxWidth, side]);

//   const handleMouseUp = useCallback(() => {
//     isResizing.current = false;
//     document.body.style.cursor = '';
//     document.body.style.userSelect = '';
//   }, []);

//   useEffect(() => {
//     window.addEventListener('mousemove', handleMouseMove);
//     window.addEventListener('mouseup', handleMouseUp);
//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [handleMouseMove, handleMouseUp]);

//   if (!isOpen) return null;

//   return (
//     <div 
//       className="relative flex-shrink-0 h-full bg-editor-sidebar border-r border-border transition-all duration-200"
//       style={{ width: isOpen ? width : 0, minWidth: isOpen ? minWidth : 0 }}
//     >
//       {children}
//       <div
//         className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/50 transition-colors ${side === 'left' ? '-right-0.5' : '-left-0.5'}`}
//         onMouseDown={handleMouseDown}
//       />
//     </div>
//   );
// }


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
  const [isHoveringDivider, setIsHoveringDivider] =
    useState(false);

  const isResizingRef = useRef(false);
  const collapsePendingRef = useRef(false);
  /**
   * Save the last usable panel width.
   *
   * Important:
   * We only save the width while the panel is actually open.
   * Therefore collapsing the panel never overwrites the
   * user's preferred width with 0.
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
  }, [
    storageKey,
    width,
    isOpen,
  ]);

  /**
   * Make sure the current width remains inside the allowed
   * range if min/max values change.
   */
  useEffect(() => {
    setWidth((current) =>
      Math.min(
        maxWidth,
        Math.max(minWidth, current),
      ),
    );
  }, [
    minWidth,
    maxWidth,
  ]);

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
        event.currentTarget.setPointerCapture(
          event.pointerId,
        );
      } catch {
        // Pointer capture is not supported everywhere.
      }
    },
    [isOpen],
  );

  /**
   * Handle resize.
   *
   * Unlike the original implementation, the mouse is allowed
   * to move below minWidth while dragging.
   *
   * Once the user reaches the edge, the panel collapses.
   */
  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!isResizingRef.current) {
        return;
      }

      const workspaceElement =
        document.querySelector(
          '[data-editor-workspace="true"]',
        );

      if (!workspaceElement) {
        return;
      }

      const workspaceRect =
        workspaceElement.getBoundingClientRect();

      let newWidth: number;

      if (side === 'left') {
        newWidth =
          event.clientX -
          workspaceRect.left;
      } else {
        newWidth =
          workspaceRect.right -
          event.clientX;
      }

      /*
      * ---------------------------------------------------------
      * Collapse zone
      * ---------------------------------------------------------
      *
      * Do NOT collapse immediately.
      *
      * Just mark the resize as pending.
      */
      if (newWidth <= COLLAPSE_THRESHOLD) {
        collapsePendingRef.current = true;

        /*
        * Keep the panel visually at minimum width while
        * the pointer is still down.
        *
        * This prevents the panel from disappearing underneath
        * the mouse before pointerup.
        */
        setWidth(minWidth);

        return;
      }

      /*
      * The mouse moved back away from the edge.
      *
      * Cancel pending collapse.
      */
      collapsePendingRef.current = false;

      const nextWidth = Math.min(
        maxWidth,
        Math.max(minWidth, newWidth),
      );

      setWidth(nextWidth);
    },
    [
      maxWidth,
      minWidth,
      side,
    ],
  );

  /**
   * Finish resizing.
   */
  const handlePointerUp = useCallback(() => {
    if (!isResizingRef.current) {
      return;
    }

    const shouldCollapse =
      collapsePendingRef.current;

    /*
    * Reset drag state FIRST.
    */
    isResizingRef.current = false;

    collapsePendingRef.current = false;

    setIsResizing(false);

    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    /*
    * Only collapse AFTER pointerup.
    *
    * This prevents the React layout from changing while the
    * browser is still processing the drag pointer.
    */
    if (shouldCollapse) {
      requestAnimationFrame(() => {
        onCollapse?.();
      });
    }
  }, [
    onCollapse,
  ]);

  /**
   * Global pointer listeners.
   *
   * This is important because after the user starts dragging
   * the divider, the pointer can leave the divider itself.
   */
  useEffect(() => {
    window.addEventListener(
      'pointermove',
      handlePointerMove,
    );

    window.addEventListener(
      'pointerup',
      handlePointerUp,
    );

    window.addEventListener(
      'pointercancel',
      handlePointerUp,
    );

    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove,
      );

      window.removeEventListener(
        'pointerup',
        handlePointerUp,
      );

      window.removeEventListener(
        'pointercancel',
        handlePointerUp,
      );

      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [
    handlePointerMove,
    handlePointerUp,
  ]);

  /**
   * Double-clicking the divider collapses the panel.
   */
  const handleDoubleClick = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (isOpen) {
        onCollapse?.();
      }
    },
    [
      isOpen,
      onCollapse,
    ],
  );

  /**
   * ============================================================
   * COLLAPSED STATE
   * ============================================================
   *
   * Do NOT return null here.
   *
   * The original implementation returned null when closed,
   * which made it impossible to restore the panel without the
   * external button.
   *
   * Instead we render a tiny absolute edge activation zone.
   *
   * It does NOT occupy layout space.
   */
  if (!isOpen) {
    return (
      <div
        className="
          absolute
          top-0
          bottom-0
          z-50
          group
        "
        style={{
          width: EDGE_ZONE_WIDTH,
          left:
            side === 'left'
              ? 0
              : undefined,
          right:
            side === 'right'
              ? 0
              : undefined,
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
        title={
          side === 'left'
            ? 'Restore left panel'
            : 'Restore right panel'
        }
      >
        {/* Edge hover line */}
        <div
          className={`
            absolute
            top-0
            bottom-0
            w-[2px]
            transition-colors
            ${
              side === 'left'
                ? 'left-0'
                : 'right-0'
            }
            ${
              isHoveringDivider
                ? 'bg-accent'
                : 'bg-transparent'
            }
          `}
        />

        {/* Small VS Code-like grip */}
        <div
          className={`
            absolute
            top-1/2
            -translate-y-1/2
            ${
              side === 'left'
                ? 'left-0'
                : 'right-0'
            }
            h-10
            w-[3px]
            rounded-full
            bg-accent/70
            transition-opacity
            ${
              isHoveringDivider
                ? 'opacity-100'
                : 'opacity-0'
            }
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
    <div className=" relative flex flex-shrink-0 h-full bg-editor-sidebar overflow-hidden border-border "
      style={{
        width,
        minWidth: width,
        maxWidth: width,

        borderRight:
          side === 'left'
            ? '1px solid var(--border)'
            : undefined,

        borderLeft:
          side === 'right'
            ? '1px solid var(--border)'
            : undefined,
      }}
    >
      {/* ======================================================
          PANEL CONTENT
          ====================================================== */}

      <div className="
        relative
        w-full
        h-full
        min-w-0
        min-h-0
      ">
        {children}
      </div>

      {/* ======================================================
          RESIZE DIVIDER
          ====================================================== */}

      <div
        className={`
          absolute
          top-0
          bottom-0
          z-40
          w-1
          cursor-col-resize
          touch-none
          ${
            side === 'left'
              ? 'right-[-5px]'
              : 'left-[-5px]'
          }
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
        {/* Visible divider */}
        <div
          className={` absolute top-0 bottom-0  w-px  transition-colors
            ${
              side === 'left'
                ? 'right-[4px]'
                : 'left-[4px]'
            }
            ${
              isResizing ||
              isHoveringDivider
                ? 'bg-accent'
                : 'bg-border'
            }
          `}
        />

        {/* Small drag grip */}
        <div
          className={`
            absolute
            top-1/2
            -translate-y-1/2
            flex
            flex-col
            items-center
            justify-center
            gap-[3px]
            w-[10px]
            py-2
            rounded-sm
            bg-editor-panel
            border
            border-border
            shadow-sm
            transition-opacity
            ${
              side === 'left'
                ? 'right-0'
                : 'left-0'
            }
            ${
              isResizing ||
              isHoveringDivider
                ? 'w-1 bg-accent/50 opacity-100'
                : 'w-px bg-transparent'
            }
          `}
        >
          <span className=" w-[2px] h-[2px] rounded-full bg-muted-foreground" />
          <span className=" w-[2px] h-[2px] rounded-full bg-muted-foreground" />
          <span className=" w-[2px] h-[2px] rounded-full bg-muted-foreground" />
          <span className=" w-[2px] h-[2px] rounded-full bg-muted-foreground" />
          <span className=" w-[2px] h-[2px] rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
