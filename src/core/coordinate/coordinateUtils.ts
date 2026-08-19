import type {
  PagePoint,
  ScreenPoint,
  Size,
} from './coordinateTypes';

/**
 * Convert browser screen coordinates to page coordinates.
 *
 * screenX/screenY:
 *   MouseEvent.clientX / clientY
 *
 * rect:
 *   Canvas bounding rectangle
 *
 * scale:
 *   Current PDF/editor scale
 *
 * pan:
 *   Current viewer pan offset
 */
export function screenToPage(
  screen: ScreenPoint,
  rect: DOMRect,
  scale: number,
  pan = { x: 0, y: 0 }
): PagePoint {
  const safeScale = Math.max(scale, 0.0001);

  return {
    x: (screen.x - rect.left - pan.x) / safeScale,
    y: (screen.y - rect.top - pan.y) / safeScale,
  };
}

export function pageToScreen(
  point: PagePoint,
  rect: DOMRect,
  scale: number,
  pan = { x: 0, y: 0 }
): ScreenPoint {
  return {
    x: rect.left + pan.x + point.x * scale,
    y: rect.top + pan.y + point.y * scale,
  };
}

export function pageToCanvas(
  point: PagePoint,
  scale: number
): PagePoint {
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

export function canvasToPage(
  point: PagePoint,
  scale: number
): PagePoint {
  const safeScale = Math.max(scale, 0.0001);

  return {
    x: point.x / safeScale,
    y: point.y / safeScale,
  };
}

export function scalePageSize(
  size: Size,
  scale: number
): Size {
  return {
    width: size.width * scale,
    height: size.height * scale,
  };
}

export function clampScale(
  scale: number,
  min = 0.25,
  max = 4
): number {
  return Math.max(min, Math.min(max, scale));
}