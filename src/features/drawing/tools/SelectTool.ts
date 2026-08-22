import {
  BaseTool,
  CanvasEvent,
  ToolContext,
} from './BaseTool';
import {
  elementBounds,
} from '../geometry/geometryUtils';
import {
  translateStructuralElement,
} from '../geometry/transform';

const SELECTION_DRAG_THRESHOLD = 4;

function segmentIntersectsRect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): boolean {
  if (
    (p1.x >= minX &&
      p1.x <= maxX &&
      p1.y >= minY &&
      p1.y <= maxY) ||
    (p2.x >= minX &&
      p2.x <= maxX &&
      p2.y >= minY &&
      p2.y <= maxY)
  ) {
    return true;
  }

  const ccw = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
  ) =>
    (c.y - a.y) *
      (b.x - a.x) >
    (b.y - a.y) *
      (c.x - a.x);

  const intersect = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
    d: { x: number; y: number },
  ) =>
    ccw(a, c, d) !==
      ccw(b, c, d) &&
    ccw(a, b, c) !==
      ccw(a, b, d);

  const topLeft = {
    x: minX,
    y: minY,
  };

  const topRight = {
    x: maxX,
    y: minY,
  };

  const bottomRight = {
    x: maxX,
    y: maxY,
  };

  const bottomLeft = {
    x: minX,
    y: maxY,
  };

  return (
    intersect(
      p1,
      p2,
      topLeft,
      topRight,
    ) ||
    intersect(
      p1,
      p2,
      topRight,
      bottomRight,
    ) ||
    intersect(
      p1,
      p2,
      bottomRight,
      bottomLeft,
    ) ||
    intersect(
      p1,
      p2,
      bottomLeft,
      topLeft,
    )
  );
}

export class SelectTool extends BaseTool {
  cursor = 'default';

  /**
   * Start position for moving selected objects.
   */
  private dragStart: {
    x: number;
    y: number;
  } | null = null;

  /**
   * Original copies of the objects being moved.
   */
  private initial = new Map<
    string,
    any
  >();

  /**
   * Start position of a possible marquee selection.
   *
   * IMPORTANT:
   *
   * This is only used when the mouse is pressed on empty space.
   * A normal click must never become a selection rectangle.
   */
  private windowStart: {
    x: number;
    y: number;
  } | null = null;

  /**
   * True only after the pointer has moved far enough to become a
   * real marquee selection.
   */
  private isWindowSelecting = false;

  onMouseDown(
    e: CanvasEvent,
    ctx: ToolContext,
  ) {
    const shape = ctx.hitTest(
      e.x,
      e.y,
    );

    const multi =
      e.rawEvent.shiftKey ||
      e.rawEvent.ctrlKey ||
      e.rawEvent.metaKey;

    /**
     * ---------------------------------------------------------------
     * OBJECT CLICK
     * ---------------------------------------------------------------
     *
     * hitTest() returns ONE object only.
     *
     * Therefore a normal click can only select ONE object.
     */
    if (shape) {
      const alreadySelected =
        ctx
          .getState()
          .drawing.selectedShapeIds.includes(
            shape.id,
          );

      /**
       * Shift/Ctrl/Cmd + click on an already selected object:
       *
       * Toggle that object.
       */
      if (
        multi &&
        alreadySelected
      ) {
        ctx.selectShape(
          shape.id,
          true,
        );

        this.dragStart = null;
        this.windowStart = null;
        this.isWindowSelecting = false;
        this.initial.clear();

        return;
      }

      /**
       * Normal click:
       *
       * Select exactly this object.
       */
      ctx.selectShape(
        shape.id,
        multi,
      );

      /**
       * Get the selection AFTER selectShape().
       *
       * This is important for modifier-key multi-selection.
       */
      const selectedIds = multi
        ? new Set(
            ctx
              .getState()
              .drawing.selectedShapeIds,
          )
        : new Set([
            shape.id,
          ]);

      /**
       * Store the original geometry of all selected objects
       * for drag operations.
       */
      this.initial.clear();

      for (const currentShape of ctx
        .getState()
        .drawing.shapes) {
        if (
          selectedIds.has(
            currentShape.id,
          )
        ) {
          this.initial.set(
            currentShape.id,
            JSON.parse(
              JSON.stringify(
                currentShape,
              ),
            ),
          );
        }
      }

      /**
       * Prepare for possible drag.
       */
      this.dragStart = {
        x: e.x,
        y: e.y,
      };

      /**
       * IMPORTANT:
       *
       * A successful object hit can NEVER start marquee selection.
       */
      this.windowStart = null;
      this.isWindowSelecting = false;

      ctx.beginHistory();

      return;
    }

    /**
     * ---------------------------------------------------------------
     * EMPTY CANVAS CLICK
     * ---------------------------------------------------------------
     *
     * Clear the current selection, but do not immediately start a
     * marquee selection.
     */
    ctx.clearSelection();

    this.dragStart = null;
    this.initial.clear();

    this.windowStart = {
      x: e.x,
      y: e.y,
    };

    this.isWindowSelecting = false;
  }

  onMouseMove(
    e: CanvasEvent,
    ctx: ToolContext,
  ) {
    /**
     * ---------------------------------------------------------------
     * MOVE SELECTED OBJECT(S)
     * ---------------------------------------------------------------
     */
    if (this.dragStart) {
      const dx =
        e.x -
        this.dragStart.x;

      const dy =
        e.y -
        this.dragStart.y;

      for (const [
        id,
        shape,
      ] of this.initial) {
        const next =
          'geometry' in shape
            ? translateStructuralElement(
                shape,
                dx,
                dy,
              )
            : this.translateLegacy(
                shape,
                dx,
                dy,
              );

        ctx.updateShape(
          id,
          next as any,
        );
      }

      return;
    }

    /**
     * ---------------------------------------------------------------
     * MARQUEE SELECTION
     * ---------------------------------------------------------------
     */
    if (this.windowStart) {
      const dx =
        e.x -
        this.windowStart.x;

      const dy =
        e.y -
        this.windowStart.y;

      const distance = Math.hypot(
        dx,
        dy,
      );

      /**
       * Ignore tiny mouse movements.
       *
       * This prevents an ordinary click from becoming a zero-size
       * selection rectangle.
       */
      if (
        !this.isWindowSelecting &&
        distance <
          SELECTION_DRAG_THRESHOLD
      ) {
        return;
      }

      this.isWindowSelecting = true;
    }
  }

  onMouseUp(
    e: CanvasEvent,
    ctx: ToolContext,
  ) {
    /**
     * ---------------------------------------------------------------
     * FINISH OBJECT DRAG
     * ---------------------------------------------------------------
     */
    if (this.dragStart) {
      this.dragStart = null;
      this.initial.clear();

      ctx.endHistory();

      return;
    }

    /**
     * ---------------------------------------------------------------
     * FINISH EMPTY-CANVAS CLICK / MARQUEE
     * ---------------------------------------------------------------
     */
    if (!this.windowStart) {
      return;
    }

    const start =
      this.windowStart;

    const end = {
      x: e.x,
      y: e.y,
    };

    const dragDistance =
      Math.hypot(
        end.x - start.x,
        end.y - start.y,
      );

    /**
     * ---------------------------------------------------------------
     * NORMAL CLICK ON EMPTY SPACE
     * ---------------------------------------------------------------
     *
     * This is the critical fix.
     *
     * Do NOT run the marquee-selection algorithm for a zero-size
     * rectangle.
     */
    if (
      !this.isWindowSelecting &&
      dragDistance <
        SELECTION_DRAG_THRESHOLD
    ) {
      this.windowStart = null;
      this.isWindowSelecting = false;

      return;
    }

    /**
     * ---------------------------------------------------------------
     * REAL MARQUEE SELECTION
     * ---------------------------------------------------------------
     */
    const minX = Math.min(
      start.x,
      end.x,
    );

    const maxX = Math.max(
      start.x,
      end.x,
    );

    const minY = Math.min(
      start.y,
      end.y,
    );

    const maxY = Math.max(
      start.y,
      end.y,
    );

    const state =
      ctx.getState();

    const ids = state.drawing.shapes
      .filter(
        (shape) =>
          shape.pageIndex ===
          state.pdf.currentPage,
      )
      .filter((shape) => {
        /**
         * Structural elements.
         */
        if ('geometry' in shape) {
          if (
            shape.type === 'beam' ||
            shape.type === 'wall'
          ) {
            return segmentIntersectsRect(
              shape.geometry.start,
              shape.geometry.end,
              minX,
              minY,
              maxX,
              maxY,
            );
          }

          const bounds =
            elementBounds(shape);

          return (
            bounds.maxX >= minX &&
            bounds.minX <= maxX &&
            bounds.maxY >= minY &&
            bounds.minY <= maxY
          );
        }

        /**
         * Legacy line / measurement.
         */
        if (
          shape.type === 'line' ||
          shape.type === 'measure'
        ) {
          const [
            x1,
            y1,
            x2,
            y2,
          ] = shape.points;

          return segmentIntersectsRect(
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            minX,
            minY,
            maxX,
            maxY,
          );
        }

        /**
         * Other legacy elements.
         */
        const bounds =
          this.legacyBounds(
            shape as any,
          );

        return (
          bounds.maxX >= minX &&
          bounds.minX <= maxX &&
          bounds.maxY >= minY &&
          bounds.minY <= maxY
        );
      })
      .map(
        (shape) =>
          shape.id,
      );

    /**
     * Marquee selection is intentionally allowed to select
     * multiple objects.
     */
    ctx.dispatch({
      type: 'drawing/selectShapes',
      payload: ids,
    });

    this.windowStart = null;
    this.isWindowSelecting = false;
  }

  onKeyDown(
    e: KeyboardEvent,
    ctx: ToolContext,
  ) {
    if (e.key === 'Escape') {
      this.dragStart = null;
      this.windowStart = null;
      this.isWindowSelecting = false;
      this.initial.clear();

      ctx.endHistory();

      return;
    }

    if (
      e.key === 'Delete' ||
      e.key === 'Backspace'
    ) {
      ctx.deleteSelected();
    }
  }

  /**
   * Move legacy drawing elements.
   */
  private translateLegacy(
    shape: any,
    dx: number,
    dy: number,
  ) {
    const copy = {
      ...shape,
    };

    if ('x' in copy) {
      copy.x += dx;
    }

    if ('y' in copy) {
      copy.y += dy;
    }

    if ('points' in copy) {
      copy.points =
        copy.points.map(
          (
            value: number,
            index: number,
          ) =>
            value +
            (index % 2
              ? dy
              : dx),
        );
    }

    return copy;
  }

  /**
   * Calculate the bounds of a legacy drawing element.
   */
  private legacyBounds(
    shape: any,
  ) {
    if (
      'x' in shape &&
      'width' in shape
    ) {
      return {
        minX: shape.x,
        minY: shape.y,
        maxX:
          shape.x +
          shape.width,
        maxY:
          shape.y +
          shape.height,
      };
    }

    if ('points' in shape) {
      const xs =
        shape.points.filter(
          (
            _: number,
            index: number,
          ) =>
            index % 2 === 0,
        );

      const ys =
        shape.points.filter(
          (
            _: number,
            index: number,
          ) =>
            index % 2 === 1,
        );

      return {
        minX: Math.min(
          ...xs,
        ),
        minY: Math.min(
          ...ys,
        ),
        maxX: Math.max(
          ...xs,
        ),
        maxY: Math.max(
          ...ys,
        ),
      };
    }

    return {
      minX: shape.x - 5,
      minY: shape.y - 5,
      maxX: shape.x + 5,
      maxY: shape.y + 5,
    };
  }
}