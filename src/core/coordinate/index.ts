// src/core/coordinate/index.ts
export interface Point2D { x: number; y: number; }

/**
 * Converts Canvas CSS coordinates to Page/PDF coordinates.
 * In this editor, shapes are stored in 1:1 Page coordinates.
 * The canvas context is scaled by `pdfScale * dpr`.
 */
export function canvasToPage(canvasX: number, canvasY: number, scale: number): Point2D {
  return { x: canvasX / scale, y: canvasY / scale };
}

export function pageToCanvas(pageX: number, pageY: number, scale: number): Point2D {
  return { x: pageX * scale, y: pageY * scale };
}

export function screenToPage(
  clientX: number, clientY: number, containerRect: DOMRect, 
  panOffset: Point2D, scale: number
): Point2D {
  const relativeX = clientX - containerRect.left - panOffset.x;
  const relativeY = clientY - containerRect.top - panOffset.y;
  return canvasToPage(relativeX, relativeY, scale);
}