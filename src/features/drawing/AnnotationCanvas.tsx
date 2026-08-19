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

import type {
  Shape,
  TextShape,
} from '@/app/store/slices/drawingSlice';

import type {
  StructuralElement,
} from './elements/elementTypes';

import { renderShape } from './ShapeRenderer';

import { useHitTest } from './hooks/useHitTest';

import { useCanvasEvents } from './hooks/useCanvasEvents';

import {
  StructuralPropertyDialog,
} from './StructuralPropertyDialog';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AnnotationCanvas() {
  const dispatch =
    useAppDispatch();

  const canvasRef =
    useRef<HTMLCanvasElement>(
      null,
    );

  const pdfScale =
    useAppSelector(
      (state) =>
        state.pdf.scale,
    );

  const currentPage =
    useAppSelector(
      (state) =>
        state.pdf.currentPage,
    );

  const layers =
    useAppSelector(
      (state) =>
        state.layer.layers,
    );

  const activeLayerId =
    useAppSelector(
      (state) =>
        state.layer.activeLayerId,
    );

  /**
   * Architectural drawing scale.
   *
   * This is NOT the PDF zoom scale.
   *
   * Example:
   *
   * scaleDenominator = 100
   * means architectural drawing scale 1:100.
   */
  const scaleDenominator =
    useAppSelector(
      (state) =>
        state.drawing
          .scaleDenominator,
    );

  const shapes =
    useAppSelector(
      (state) =>
        selectShapesByPage(
          state,
          currentPage,
        ),
    );

  const selectedShapes =
    useAppSelector(
      selectSelectedShapes,
    );

  const [
    tempShape,
    setTempShape,
  ] = useState<Shape | null>(
    null,
  );

  const [
    snapPoint,
    setSnapPoint,
  ] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [
    selectionRect,
    setSelectionRect,
  ] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  /**
   * Element currently being edited.
   *
   * This is a dialog session state.
   *
   * DO NOT synchronise this state with `shapes`
   * after the dialog has opened.
   */
  const [
    propertyElement,
    setPropertyElement,
  ] = useState<StructuralElement | null>(
    null,
  );

  const [
    textDialog,
    setTextDialog,
  ] = useState({
    x: 0,
    y: 0,
    open: false,
  });

  const [
    textInput,
    setTextInput,
  ] = useState('');

  const hitTest =
    useHitTest(
      shapes,
      layers,
      5 /
        Math.max(
          pdfScale,
          0.0001,
        ),
    );

  /**
   * Open structural properties.
   */
  const openProperties =
    useCallback(
      (
        shape: Shape | null,
      ) => {
        if (
          shape &&
          'geometry' in shape
        ) {
          dispatch(
            selectShape({
              id: shape.id,
            }),
          );

          setPropertyElement(
            shape as StructuralElement,
          );
        }
      },
      [dispatch],
    );

  /**
   * Render canvas.
   */
  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const frame =
      requestAnimationFrame(
        () => {
          const dpr =
            window.devicePixelRatio ||
            1;

          const width =
            canvas.clientWidth;

          const height =
            canvas.clientHeight;

          canvas.width =
            width * dpr;

          canvas.height =
            height * dpr;

          ctx.setTransform(
            pdfScale * dpr,
            0,
            0,
            pdfScale * dpr,
            0,
            0,
          );

          ctx.clearRect(
            0,
            0,
            width,
            height,
          );

          const visible =
            new Set(
              layers
                .filter(
                  (layer) =>
                    layer.visible,
                )
                .map(
                  (layer) =>
                    layer.id,
                ),
            );

          shapes.forEach(
            (shape) => {
              if (
                visible.has(
                  shape.layerId,
                )
              ) {
                renderShape(
                  ctx,
                  shape,
                  selectedShapes.some(
                    (selected) =>
                      selected.id ===
                      shape.id,
                  ),
                );
              }
            },
          );

          if (tempShape) {
            renderShape(
              ctx,
              tempShape,
              false,
            );
          }

          if (selectionRect) {
            ctx.save();

            ctx.strokeStyle =
              '#2563eb';

            ctx.fillStyle =
              'rgba(37,99,235,.08)';

            ctx.lineWidth =
              1 / pdfScale;

            ctx.setLineDash([
              5 / pdfScale,
              4 / pdfScale,
            ]);

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

            ctx.strokeStyle =
              '#f59e0b';

            ctx.lineWidth =
              1 / pdfScale;

            ctx.beginPath();

            ctx.moveTo(
              snapPoint.x -
                7 / pdfScale,
              snapPoint.y,
            );

            ctx.lineTo(
              snapPoint.x +
                7 / pdfScale,
              snapPoint.y,
            );

            ctx.moveTo(
              snapPoint.x,
              snapPoint.y -
                7 / pdfScale,
            );

            ctx.lineTo(
              snapPoint.x,
              snapPoint.y +
                7 / pdfScale,
            );

            ctx.stroke();

            ctx.restore();
          }
        },
      );

    return () =>
      cancelAnimationFrame(
        frame,
      );
  }, [
    shapes,
    tempShape,
    selectedShapes,
    pdfScale,
    layers,
    snapPoint,
    selectionRect,
  ]);

  /**
   * Add text.
   */
  const submitText =
    useCallback(() => {
      if (
        textInput.trim()
      ) {
        dispatch(
          addShape({
            type: 'text',
            x: textDialog.x,
            y: textDialog.y,
            text: textInput.trim(),
            fontSize: 16,
            fontFamily:
              'sans-serif',
            layerId:
              activeLayerId,
            pageIndex:
              currentPage,
            color: '#000000',
            strokeWidth: 1,
            opacity: 1,
            zIndex: 0,
          } as Omit<
            TextShape,
            'id' |
              'createdAt' |
              'updatedAt'
          >),
        );
      }

      setTextDialog({
        x: 0,
        y: 0,
        open: false,
      });

      setTextInput('');
    }, [
      dispatch,
      textInput,
      textDialog.x,
      textDialog.y,
      activeLayerId,
      currentPage,
    ]);

  useCanvasEvents(
    canvasRef,
    hitTest,
    tempShape,
    setTempShape,

    (x, y) =>
      setTextDialog({
        x,
        y,
        open: true,
      }),

    setSnapPoint,
    openProperties,
    setSelectionRect,
  );

  /**
   * IMPORTANT:
   *
   * There is deliberately NO:
   *
   * useEffect(() => {
   *   const fresh = shapes.find(...)
   *   setPropertyElement(fresh)
   * }, [shapes, propertyElement])
   *
   * The dialog is independent from Redux updates.
   *
   * This prevents:
   *
   * Apply
   *   -> updateShape()
   *   -> shapes changes
   *   -> dialog reopens
   */
  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{
          pointerEvents:
            'auto',
        }}
      />

      <Dialog
        open={
          textDialog.open
        }
        onOpenChange={(
          open,
        ) =>
          setTextDialog(
            (current) => ({
              ...current,
              open,
            }),
          )
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Text
            </DialogTitle>
          </DialogHeader>

          <Input
            value={textInput}
            onChange={(event) =>
              setTextInput(
                event.target.value,
              )
            }
            autoFocus
          />

          <DialogFooter>
            <Button
              type="button"
              onClick={
                submitText
              }
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StructuralPropertyDialog
        element={
          propertyElement
        }
        open={
          propertyElement !==
          null
        }
        scaleDenominator={
          scaleDenominator
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setPropertyElement(
              null,
            );
          }
        }}
      />
    </>
  );
}