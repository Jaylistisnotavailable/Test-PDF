// src/core/coordinate/coordinateUtils.ts

import type {
  PagePoint,
  ScreenPoint,
  Size,
} from './coordinateTypes';

/**
 * Browser screen coordinate
 * → PDF page coordinate.
 *
 * IMPORTANT:
 *
 * This legacy function is kept for compatibility with existing
 * drawing code.
 *
 * `displayScale` means PDF viewer zoom.
 *
 * It does NOT mean:
 *
 * drawing scale 1:100 / 1:50.
 */
export function screenToPage(
  screen: ScreenPoint,
  rect: DOMRect,
  displayScale: number,
  pan = {
    x: 0,
    y: 0,
  },
): PagePoint {
  const safeScale = Math.max(
    Number.isFinite(displayScale)
      ? displayScale
      : 1,
    0.0001,
  );

  return {
    x:
      (
        screen.x -
        rect.left -
        pan.x
      ) / safeScale,

    y:
      (
        screen.y -
        rect.top -
        pan.y
      ) / safeScale,
  };
}

/**
 * Convert browser/client coordinates to PDF page coordinates
 * using the ACTUAL displayed page size.
 *
 * This is the preferred function for mouse interaction.
 *
 * The important distinction is:
 *
 * Browser:
 *   clientX / clientY
 *
 * Canvas:
 *   CSS/display width / height
 *
 * PDF page:
 *   logical page width / height
 *
 * The internal canvas pixel size is deliberately NOT used here,
 * because PDF.js may render at devicePixelRatio > 1.
 *
 * PDF coordinate system:
 *
 *   X → right
 *   Y → down
 */
export function screenToPageByPageSize(
  screen: ScreenPoint,
  rect: DOMRect,
  pageSize: Size,
): PagePoint {
  const pageWidth =
    Number.isFinite(pageSize.width) &&
    pageSize.width > 0
      ? pageSize.width
      : 1;

  const pageHeight =
    Number.isFinite(pageSize.height) &&
    pageSize.height > 0
      ? pageSize.height
      : 1;

  const displayWidth =
    Number.isFinite(rect.width) &&
    rect.width > 0
      ? rect.width
      : pageWidth;

  const displayHeight =
    Number.isFinite(rect.height) &&
    rect.height > 0
      ? rect.height
      : pageHeight;

  const localX =
    screen.x - rect.left;

  const localY =
    screen.y - rect.top;

  return {
    x:
      (localX / displayWidth) *
      pageWidth,

    y:
      (localY / displayHeight) *
      pageHeight,
  };
}

/**
 * Same as screenToPageByPageSize(), but clamps the mouse position
 * to the visible PDF page.
 *
 * Useful when the canvas is slightly affected by browser rounding,
 * fractional zoom or devicePixelRatio.
 */
export function screenToPageClamped(
  screen: ScreenPoint,
  rect: DOMRect,
  pageSize: Size,
): PagePoint {
  const point =
    screenToPageByPageSize(
      screen,
      rect,
      pageSize,
    );

  return {
    x: Math.max(
      0,
      Math.min(
        pageSize.width,
        point.x,
      ),
    ),

    y: Math.max(
      0,
      Math.min(
        pageSize.height,
        point.y,
      ),
    ),
  };
}

/**
 * Convert PDF page coordinates to browser/client coordinates
 * using the actual displayed page size.
 *
 * This is the inverse of screenToPageByPageSize().
 */
export function pageToScreenByPageSize(
  point: PagePoint,
  rect: DOMRect,
  pageSize: Size,
): ScreenPoint {
  const pageWidth =
    Number.isFinite(pageSize.width) &&
    pageSize.width > 0
      ? pageSize.width
      : 1;

  const pageHeight =
    Number.isFinite(pageSize.height) &&
    pageSize.height > 0
      ? pageSize.height
      : 1;

  return {
    x:
      rect.left +
      (
        point.x /
        pageWidth
      ) *
      rect.width,

    y:
      rect.top +
      (
        point.y /
        pageHeight
      ) *
      rect.height,
  };
}

/**
 * Legacy page → screen conversion.
 */
export function pageToScreen(
  point: PagePoint,
  rect: DOMRect,
  displayScale: number,
  pan = {
    x: 0,
    y: 0,
  },
): ScreenPoint {
  const safeScale = Math.max(
    Number.isFinite(displayScale)
      ? displayScale
      : 1,
    0.0001,
  );

  return {
    x:
      rect.left +
      pan.x +
      point.x *
        safeScale,

    y:
      rect.top +
      pan.y +
      point.y *
        safeScale,
  };
}

/**
 * Page coordinates → canvas coordinates.
 *
 * Legacy helper retained for drawing code.
 */
export function pageToCanvas(
  point: PagePoint,
  displayScale: number,
): PagePoint {
  const safeScale = Math.max(
    Number.isFinite(displayScale)
      ? displayScale
      : 1,
    0.0001,
  );

  return {
    x:
      point.x *
      safeScale,

    y:
      point.y *
      safeScale,
  };
}

/**
 * Canvas coordinates → page coordinates.
 *
 * Legacy helper retained for drawing code.
 */
export function canvasToPage(
  point: PagePoint,
  displayScale: number,
): PagePoint {
  const safeScale = Math.max(
    Number.isFinite(displayScale)
      ? displayScale
      : 1,
    0.0001,
  );

  return {
    x:
      point.x /
      safeScale,

    y:
      point.y /
      safeScale,
  };
}

/**
 * Scale a PDF page size by viewer zoom.
 *
 * This is a display operation only.
 *
 * It must NOT be confused with engineering drawing scale
 * such as 1:50 or 1:100.
 */
export function scalePageSize(
  size: Size,
  displayScale: number,
): Size {
  const safeScale = Math.max(
    Number.isFinite(displayScale)
      ? displayScale
      : 1,
    0.0001,
  );

  return {
    width:
      size.width *
      safeScale,

    height:
      size.height *
      safeScale,
  };
}

/**
 * Clamp viewer zoom.
 */
export function clampScale(
  scale: number,
  min = 0.25,
  max = 4,
): number {
  return Math.max(
    min,
    Math.min(
      max,
      scale,
    ),
  );
}