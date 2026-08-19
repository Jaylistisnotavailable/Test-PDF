export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Coordinate systems used by the PDF editor.
 *
 * page:
 *   PDF page logical coordinates.
 *   This is the primary coordinate system for editor objects.
 *
 * screen:
 *   Browser/client coordinates from MouseEvent/PointerEvent.
 *
 * viewport:
 *   PDF.js viewport coordinates.
 */
export interface CoordinateTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface PagePoint extends Point {
  x: number;
  y: number;
}

export interface ScreenPoint extends Point {}

export interface ViewportPoint extends Point {}

export interface PageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
