import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

import {
  useAppDispatch,
  useAppSelector,
} from '@/app/store/hooks';

import {
  addShape,
  selectShapesByPage,
  selectSelectedShapes,
  selectShape,
} from '@/app/store/slices/drawingSlice';

import type { Shape, TextShape } from '@/app/store/slices/drawingSlice';
import type { StructuralElement } from './elements/elementTypes';
import { renderShape } from './ShapeRenderer';
import { useHitTest } from './hooks/useHitTest';
import { useCanvasEvents } from './hooks/useCanvasEvents';
import { StructuralPropertyDialog } from './StructuralPropertyDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Annotation layer contract:
 *
 * 1. Shape geometry is persisted in PDF PAGE COORDINATES (pt).
 * 2. PDF viewer zoom is state.pdf.scale and only affects rendering/input
 *    conversion. It is never used to calculate engineering dimensions.
 * 3. Drawing 1:N is state.drawing.scaleNumerator/scaleDenominator and only
 *    affects real-world length/dimension conversion.
 */
export function AnnotationCanvas() {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayScale = useAppSelector((state) => state.pdf.scale);
  const currentPage = useAppSelector((state) => state.pdf.currentPage);
  const layers = useAppSelector((state) => state.layer.layers);
  const activeLayerId = useAppSelector((state) => state.layer.activeLayerId);
  const scaleNumerator = useAppSelector((state) => state.drawing.scaleNumerator);
  const scaleDenominator = useAppSelector((state) => state.drawing.scaleDenominator);

  const shapes = useAppSelector((state) => selectShapesByPage(state, currentPage));
  const selectedShapes = useAppSelector(selectSelectedShapes);

  const [tempShape, setTempShape] = useState<Shape | null>(null);
  const [snapPoint, setSnapPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [propertyElement, setPropertyElement] = useState<StructuralElement | null>(null);
  const [textDialog, setTextDialog] = useState({ x: 0, y: 0, open: false });
  const [textInput, setTextInput] = useState('');
  const [canvasSizeVersion, setCanvasSizeVersion] = useState(0);

  // PDF.js changes the page viewport asynchronously during zoom. Observe the
  // actual page container so the overlay redraws immediately after the PDF
  // canvas reaches the new size; no extra click is required.
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent || typeof ResizeObserver === 'undefined') return;

    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCanvasSizeVersion((v) => v + 1));
    });
    observer.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  const hitTest = useHitTest(
    shapes,
    layers,
    5 / Math.max(displayScale, 0.0001),
  );

  const openProperties = useCallback((shape: Shape | null) => {
    if (shape && 'geometry' in shape) {
      dispatch(selectShape({ id: shape.id }));
      setPropertyElement(shape as StructuralElement);
    }
  }, [dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frame = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (!width || !height) return;

      canvas.width = Math.max(1, Math.ceil(width * dpr));
      canvas.height = Math.max(1, Math.ceil(height * dpr));

      // Shapes live in page coordinates. Convert to device pixels with the
      // viewer display scale only. The engineering scale is deliberately absent.
      // Clear using device pixels first. Then use exactly one transform:
      // persistent PDF-page points -> current viewer zoom.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(
        displayScale * dpr,
        0,
        0,
        displayScale * dpr,
        0,
        0,
      );

      const visible = new Set(
        layers.filter((layer) => layer.visible).map((layer) => layer.id),
      );

      shapes.forEach((shape) => {
        if (visible.has(shape.layerId)) {
          renderShape(
            ctx,
            shape,
            selectedShapes.some((selected) => selected.id === shape.id),
          );
        }
      });

      if (tempShape) {
        renderShape(ctx, tempShape, false);
      }

      if (selectionRect) {
        ctx.save();
        ctx.strokeStyle = '#2563eb';
        ctx.fillStyle = 'rgba(37,99,235,.08)';
        ctx.lineWidth = 1 / displayScale;
        ctx.setLineDash([5 / displayScale, 4 / displayScale]);
        ctx.fillRect(
          selectionRect.x,
          selectionRect.y,
          selectionRect.width,
          selectionRect.height,
        );
        ctx.strokeRect(
          selectionRect.x,
          selectionRect.y,
          selectionRect.width,
          selectionRect.height,
        );
        ctx.restore();
      }

      if (snapPoint) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1 / displayScale;
        ctx.beginPath();
        ctx.moveTo(snapPoint.x - 7 / displayScale, snapPoint.y);
        ctx.lineTo(snapPoint.x + 7 / displayScale, snapPoint.y);
        ctx.moveTo(snapPoint.x, snapPoint.y - 7 / displayScale);
        ctx.lineTo(snapPoint.x, snapPoint.y + 7 / displayScale);
        ctx.stroke();
        ctx.restore();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [
    shapes,
    tempShape,
    selectedShapes,
    displayScale,
    layers,
    snapPoint,
    selectionRect,
    canvasSizeVersion,
  ]);

  const submitText = useCallback(() => {
    if (textInput.trim()) {
      dispatch(addShape({
        type: 'text',
        x: textDialog.x,
        y: textDialog.y,
        text: textInput.trim(),
        fontSize: 16,
        fontFamily: 'sans-serif',
        layerId: activeLayerId,
        pageIndex: currentPage,
        color: '#000000',
        strokeWidth: 1,
        opacity: 1,
        zIndex: 0,
      } as Omit<TextShape, 'id' | 'createdAt' | 'updatedAt'>));
    }

    setTextDialog({ x: 0, y: 0, open: false });
    setTextInput('');
  }, [dispatch, textInput, textDialog.x, textDialog.y, activeLayerId, currentPage]);

  useCanvasEvents(
    canvasRef,
    hitTest,
    tempShape,
    setTempShape,
    (x, y) => setTextDialog({ x, y, open: true }),
    setSnapPoint,
    openProperties,
    setSelectionRect,
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{ pointerEvents: 'auto' }}
      />

      <Dialog
        open={textDialog.open}
        onOpenChange={(open) => setTextDialog((current) => ({ ...current, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text</DialogTitle>
          </DialogHeader>
          <Input
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" onClick={submitText}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StructuralPropertyDialog
        element={propertyElement}
        open={propertyElement !== null}
        scaleNumerator={scaleNumerator}
        scaleDenominator={scaleDenominator}
        onOpenChange={(open) => {
          if (!open) setPropertyElement(null);
        }}
      />
    </>
  );
}
