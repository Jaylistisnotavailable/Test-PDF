// src/core/coordinate/index.ts

/**
 * Basic 2D point used by the coordinate system.
 *
 * The drawing editor stores structural geometry in page coordinates.
 * Canvas coordinates are converted using the current PDF scale.
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Page/PDF coordinate.
 *
 * PagePoint is intentionally kept as a semantic alias of Point2D.
 * This allows structural drawing code to distinguish page coordinates
 * from other coordinate systems without creating incompatible types.
 */
export type PagePoint = Point2D;

/**
 * Converts Canvas CSS coordinates to Page/PDF coordinates.
 *
 * In this editor, shapes are stored in 1:1 Page coordinates.
 * The canvas context is scaled by `pdfScale * dpr`.
 */
export function canvasToPage(
  canvasX: number,
  canvasY: number,
  scale: number,
): PagePoint {
  return {
    x: canvasX / scale,
    y: canvasY / scale,
  };
}

/**
 * Converts Page/PDF coordinates to Canvas coordinates.
 */
export function pageToCanvas(
  pageX: number,
  pageY: number,
  scale: number,
): Point2D {
  return {
    x: pageX * scale,
    y: pageY * scale,
  };
}

/**
 * Converts browser screen/client coordinates to Page/PDF coordinates.
 */
export function screenToPage(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  panOffset: Point2D,
  scale: number,
): PagePoint {
  const relativeX =
    clientX -
    containerRect.left -
    panOffset.x;

  const relativeY =
    clientY -
    containerRect.top -
    panOffset.y;

  return canvasToPage(
    relativeX,
    relativeY,
    scale,
  );
}
