export interface Point2D { x: number; y: number; }

/**
 * Convert CSS/canvas coordinates to persistent PDF page coordinates.
 * `displayScale` is ONLY the PDF viewer zoom factor.
 */
export function canvasToPage(canvasX: number, canvasY: number, displayScale: number): Point2D {
  const scale = Math.max(displayScale, 0.0001);
  return { x: canvasX / scale, y: canvasY / scale };
}

export function pageToCanvas(pageX: number, pageY: number, displayScale: number): Point2D {
  return { x: pageX * displayScale, y: pageY * displayScale };
}

export function screenToPage(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  panOffset: Point2D,
  displayScale: number,
): Point2D {
  return canvasToPage(
    clientX - containerRect.left - panOffset.x,
    clientY - containerRect.top - panOffset.y,
    displayScale,
  );
}

export * from './engineeringScale';
