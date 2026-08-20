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
 * scale here means PDF VIEWER ZOOM.
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
  const safeScale =
    Math.max(
      displayScale,
      0.0001,
    );

  return {
    x:
      (
        screen.x -
        rect.left -
        pan.x
      ) /
      safeScale,

    y:
      (
        screen.y -
        rect.top -
        pan.y
      ) /
      safeScale,
  };
}

export function pageToScreen(
  point: PagePoint,
  rect: DOMRect,
  displayScale: number,
  pan = {
    x: 0,
    y: 0,
  },
): ScreenPoint {
  return {
    x:
      rect.left +
      pan.x +
      point.x *
        displayScale,

    y:
      rect.top +
      pan.y +
      point.y *
        displayScale,
  };
}

export function pageToCanvas(
  point: PagePoint,
  displayScale: number,
): PagePoint {
  return {
    x:
      point.x *
      displayScale,

    y:
      point.y *
      displayScale,
  };
}

export function canvasToPage(
  point: PagePoint,
  displayScale: number,
): PagePoint {
  const safeScale =
    Math.max(
      displayScale,
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

export function scalePageSize(
  size: Size,
  displayScale: number,
): Size {
  return {
    width:
      size.width *
      displayScale,

    height:
      size.height *
      displayScale,
  };
}

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