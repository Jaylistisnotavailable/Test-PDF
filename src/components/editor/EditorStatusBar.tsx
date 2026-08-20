// src/components/editor/EditorStatusBar.tsx

import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { setScale, setCurrentPage } from '@/app/store/slices/pdfSlice';
import { setOriginMode, selectPageCoordinateSystem } from '@/app/store/slices/pageCoordinateSlice';
import {
  subscribeCursorCoordinate,
  type CursorCoordinateEvent,
} from '@/core/coordinate/coordinateEvents';

import { ZoomIn, ZoomOut, Maximize, Crosshair } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function EditorStatusBar({ onFitWidth, onFitPage}: { onFitWidth?: () => void; onFitPage?: () => void}) {
  const dispatch = useAppDispatch();

  const { currentPage, totalPages, scale } = useAppSelector((s) => s.pdf);

  const pageCoordinateSystem = useAppSelector((state) =>
    selectPageCoordinateSystem(state, currentPage)
  );

  const [cursor, setCursor] = useState<CursorCoordinateEvent | null>(null);

  useEffect(() => {
    return subscribeCursorCoordinate(
      (nextCursor) => {
        if (!nextCursor) {
          setCursor(null);
          return;
        }

        console.log(
          'CURSOR:',
          nextCursor.pagePoint,
          nextCursor.engineeringPoint,
        );

        setCursor(nextCursor);
      },
    );
  }, []);

  const zoomIn = () => dispatch(setScale(Math.min(4.0, scale + 0.25)));
  const zoomOut = () => dispatch(setScale(Math.max(0.25, scale - 0.25)));

  const coordinateUnit = pageCoordinateSystem.unit;

  const scaleText =
    pageCoordinateSystem.scaleNumerator === 1
      ? `1:${pageCoordinateSystem.scaleDenominator}`
      : `${pageCoordinateSystem.scaleNumerator}:${pageCoordinateSystem.scaleDenominator}`;

  return (
    <footer className="h-8 flex items-center justify-between px-3 bg-editor-toolbar border-t border-border text-xs text-muted-foreground shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <span>
          Page {currentPage} of {totalPages || '--'}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6"
              onClick={() =>
                dispatch(setCurrentPage(Math.max(1, currentPage - 1)))
              }
            >
              ‹
            </Button>

            <Button variant="ghost" size="icon" className="h-6 w-6"
              onClick={() =>
                dispatch(setCurrentPage(Math.min(totalPages, currentPage + 1)))
              }
            >
              ›
            </Button>
          </div>
        )}

        <div className="w-px h-4 bg-border" />

        <span className="font-mono whitespace-nowrap">
          Scale <strong>{scaleText}</strong>
        </span>

        <Button
          variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1"
          onClick={() => dispatch(setOriginMode(true))}
        >
          <Crosshair className="w-3.5 h-3.5" />
          Set Origin
        </Button>

        <div className="w-px h-4 bg-border" />

        <span className="font-mono whitespace-nowrap">
          X:{' '}
          {cursor ? cursor.engineeringPoint.x.toFixed(
                coordinateUnit === 'm' ? 3 : coordinateUnit === 'cm' ? 2 : 1
              )
            : '—'}{' '}
          {coordinateUnit}
        </span>

        <span className="font-mono whitespace-nowrap">
          Y:{' '}
          {cursor ? cursor.engineeringPoint.y.toFixed(
                coordinateUnit === 'm' ? 3
                  : coordinateUnit === 'cm' ? 2 : 1
              )
            : '—'}{' '}
          {coordinateUnit}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-6 w-6"
          onClick={zoomOut}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>

        <span className="w-12 text-center font-mono">
          {Math.round(scale * 100)}%
        </span>

        <Button variant="ghost" size="icon" className="h-6 w-6"
          onClick={zoomIn}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-3 bg-border mx-1" />

        <Button variant="ghost" size="sm" className="h-6 text-xs px-2"
          onClick={onFitWidth}
        >
          Fit Width
        </Button>

        <Button variant="ghost" size="sm" className="h-6 text-xs px-2"
          onClick={onFitPage}
        >
          Fit Page
        </Button>

        <Button variant="ghost" size="icon" className="h-6 w-6"
          onClick={() => dispatch(setScale(1.0))}
        >
          <Maximize className="w-3.5 h-3.5" />
        </Button>
      </div>
    </footer>
  );
}