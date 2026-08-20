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

const EVENT_NAME =
  'pdf-editor:cursor-coordinate';

export function emitCursorCoordinate(
  detail: CursorCoordinateEvent,
): void {
  if (
    typeof window === 'undefined'
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      EVENT_NAME,
      {
        detail,
      },
    ),
  );
}

export function emitCursorCoordinateClear(): void {
  if (
    typeof window === 'undefined'
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
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
  if (
    typeof window === 'undefined'
  ) {
    return () => undefined;
  }

  const handler = (
    event: Event,
  ) => {
    const custom =
      event as CustomEvent<
        CursorCoordinateEvent | null
      >;

    callback(
      custom.detail ?? null,
    );
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