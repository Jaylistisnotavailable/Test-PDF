// src/core/coordinate/coordinateEvents.ts

export interface CursorCoordinateEvent {
  pageIndex: number;

  pagePoint: {
    x: number;
    y: number;
  };

  engineeringPoint: {
    x: number;
    y: number;
  };

  unit: 'm' | 'cm' | 'mm';

  scaleNumerator: number;
  scaleDenominator: number;
}

const EVENT_NAME = 'pdf-editor:cursor-coordinate';

/**
 * Keep the last emitted coordinate.
 *
 * This prevents identical mouse coordinates from repeatedly
 * causing CustomEvent -> React state -> StatusBar re-render.
 */
let lastCoordinateKey: string | null = null;

/**
 * Whether the cursor is currently inside the drawing canvas.
 */
let cursorActive = false;

function makeCoordinateKey(detail: CursorCoordinateEvent): string {
  return [
    detail.pageIndex,
    detail.pagePoint.x,
    detail.pagePoint.y,
    detail.engineeringPoint.x,
    detail.engineeringPoint.y,
    detail.unit,
    detail.scaleNumerator,
    detail.scaleDenominator,
  ].join('|');
}

export function emitCursorCoordinate(
  detail: CursorCoordinateEvent,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const key = makeCoordinateKey(detail);

  /**
   * Do not dispatch identical coordinates.
   *
   * This is particularly important because mousemove events can
   * be generated repeatedly by browser/layout/canvas interactions.
   */
  if (cursorActive && key === lastCoordinateKey) {
    return;
  }

  lastCoordinateKey = key;
  cursorActive = true;

  window.dispatchEvent(
    new CustomEvent<CursorCoordinateEvent | null>(
      EVENT_NAME,
      {
        detail,
      },
    ),
  );
}

export function emitCursorCoordinateClear(): void {
  if (typeof window === 'undefined') {
    return;
  }

  /**
   * Do not repeatedly dispatch "null".
   */
  if (!cursorActive) {
    return;
  }

  cursorActive = false;
  lastCoordinateKey = null;

  window.dispatchEvent(
    new CustomEvent<CursorCoordinateEvent | null>(
      EVENT_NAME,
      {
        detail: null,
      },
    ),
  );
}

export function subscribeCursorCoordinate(
  callback: (
    value: CursorCoordinateEvent | null,
  ) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const custom =
      event as CustomEvent<CursorCoordinateEvent | null>;

    callback(custom.detail ?? null);
  };

  window.addEventListener(
    EVENT_NAME,
    handler,
  );

  return () => {
    window.removeEventListener(
      EVENT_NAME,
      handler,
    );
  };
}