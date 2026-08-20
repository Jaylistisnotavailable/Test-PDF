// src/features/drawing/hooks/useCanvasEvents.ts

import {
  useEffect,
  RefObject,
} from 'react';

import {
  useAppDispatch,
  useAppSelector,
} from '@/app/store/hooks';

import {
  store,
} from '@/app/store';

import {
  addShape,
  updateShape,
  selectShape,
  clearSelection,
  deleteSelected,
  beginHistoryTransaction,
  endHistoryTransaction,
  copySelected,
  pasteClipboard,
  setActiveTool,
  undo,
  redo,
} from '@/app/store/slices/drawingSlice';

import {
  setPageOrigin,
  selectPageCoordinateSystem,
  selectOriginMode,
  setOriginMode,
} from '@/app/store/slices/pageCoordinateSlice';

import type {
  Shape,
} from '@/app/store/slices/drawingSlice';

import type {
  StructuralElement,
} from '../elements/elementTypes';

import {
  BaseTool,
  ToolContext,
} from '../tools/BaseTool';

import {
  SelectTool,
} from '../tools/SelectTool';

import {
  PointTool,
} from '../tools/PointTool';

import {
  LineTool,
} from '../tools/LineTool';

import {
  PolylineTool,
} from '../tools/PolylineTool';

import {
  PolygonTool,
} from '../tools/PolygonTool';

import {
  RectangleTool,
} from '../tools/RectangleTool';

import {
  CircleTool,
} from '../tools/CircleTool';

import {
  TextTool,
} from '../tools/TextTool';

import {
  MeasureTool,
} from '../tools/MeasureTool';

import {
  EraserTool,
} from '../tools/EraserTool';

import {
  ColumnTool,
} from '../tools/ColumnTool';

import {
  BeamTool,
} from '../tools/BeamTool';

import {
  WallTool,
} from '../tools/WallTool';

import {
  SlabTool,
} from '../tools/SlabTool';

import {
  PortalFrameTool,
} from '../tools/PortalFrameTool';

import {
  findSnapPoint,
} from '../snapping/snapEngine';

import {
  screenToPage,
} from '@/core/coordinate/coordinateUtils';

import {
  pagePointToEngineeringUnit,
} from '@/core/coordinate/pageCoordinateSystem';

import {
  emitCursorCoordinate,
  emitCursorCoordinateClear,
} from '@/core/coordinate/coordinateEvents';

const toolInstances:
  Record<
    string,
    BaseTool
  > = {
    select:
      new SelectTool(),

    column:
      new ColumnTool(),

    beam:
      new BeamTool(),

    wall:
      new WallTool(),

    slab:
      new SlabTool(),

    portalFrame:
      new PortalFrameTool(),

    point:
      new PointTool(),

    line:
      new LineTool(),

    polyline:
      new PolylineTool(),

    polygon:
      new PolygonTool(),

    rectangle:
      new RectangleTool(),

    circle:
      new CircleTool(),

    text:
      new TextTool(),

    measure:
      new MeasureTool(),

    eraser:
      new EraserTool(),
  };

function isStructuralElement(
  shape: Shape,
): shape is StructuralElement {
  return (
    shape.type ===
      'column' ||
    shape.type ===
      'beam' ||
    shape.type ===
      'wall' ||
    shape.type ===
      'slab' ||
    shape.type ===
      'portalFrame'
  );
}

function isStructuralTool(
  tool: string,
): boolean {
  return (
    tool === 'column' ||
    tool === 'beam' ||
    tool === 'wall' ||
    tool ===
      'portalFrame'
  );
}

export function useCanvasEvents(
  canvasRef:
    RefObject<HTMLCanvasElement>,

  hitTest: (
    x: number,
    y: number,
  ) => Shape | null,

  tempShape:
    Shape | null,

  setTempShape: (
    shape: Shape | null,
  ) => void,

  showTextDialog: (
    x: number,
    y: number,
  ) => void,

  setSnapPoint: (
    point:
      | {
          x: number;
          y: number;
        }
      | null,
  ) => void,

  openProperties?: (
    shape: Shape | null,
  ) => void,

  setSelectionRect?: (
    rect:
      | {
          x: number;
          y: number;
          width: number;
          height: number;
        }
      | null,
  ) => void,
) {
  const dispatch =
    useAppDispatch();

  const activeTool =
    useAppSelector(
      (state) =>
        state.drawing.activeTool,
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

  const coordinateSystem =
    useAppSelector(
      (state) =>
        selectPageCoordinateSystem(
          state,
          currentPage,
        ),
    );

  const originMode =
    useAppSelector(
      selectOriginMode,
    );

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const coords = (
      event: MouseEvent,
    ) => {
      const rect =
        canvas.getBoundingClientRect();

      return screenToPage(
        {
          x:
            event.clientX,

          y:
            event.clientY,
        },

        rect,

        pdfScale,
      );
    };

    const emitCoordinate = (
      point: {
        x: number;
        y: number;
      },
    ) => {
      const engineering =
        pagePointToEngineeringUnit(
          point,
          coordinateSystem,
        );

      emitCursorCoordinate({
        pageIndex:
          currentPage,

        pagePoint:
          point,

        engineeringPoint:
          engineering,

        unit:
          coordinateSystem.unit,

        scaleNumerator:
          coordinateSystem.scaleNumerator,

        scaleDenominator:
          coordinateSystem.scaleDenominator,
      });
    };

    const getCtx =
      (): ToolContext => ({
        dispatch,

        getState:
          store.getState,

        pdfScale,

        tempShape,

        setTempShape,

        hitTest,

        showTextDialog,

        addShape: (
          shape,
        ) => {
          dispatch(
            addShape(
              shape,
            ),
          );
        },

        updateShape: (
          id,
          changes,
        ) => {
          dispatch(
            updateShape({
              id,
              changes,
            }),
          );
        },

        selectShape: (
          id,
          multiSelect,
        ) => {
          dispatch(
            selectShape({
              id,
              multiSelect,
            }),
          );
        },

        clearSelection: () => {
          dispatch(
            clearSelection(),
          );
        },

        deleteSelected: () => {
          dispatch(
            deleteSelected(),
          );
        },

        beginHistory: () => {
          dispatch(
            beginHistoryTransaction(),
          );
        },

        endHistory: () => {
          dispatch(
            endHistoryTransaction(),
          );
        },
      });

    const tool =
      toolInstances[
        activeTool
      ] ??
      toolInstances.select;

    canvas.style.cursor =
      originMode
        ? 'crosshair'
        : tool.cursor;

    let selectionStart:
      | {
          x: number;
          y: number;
        }
      | null = null;

    const getStructuralElements =
      (): StructuralElement[] => {
        const state =
          store.getState();

        return state.drawing.shapes
          .filter(
            (
              shape,
            ): shape is StructuralElement =>
              shape.pageIndex ===
                state.pdf.currentPage &&
              isStructuralElement(
                shape,
              ),
          );
      };

    const handleMouseDown =
      (
        event: MouseEvent,
      ) => {
        const point =
          coords(event);

        /*
         * SET PAGE ORIGIN MODE
         *
         * The next click defines
         * the PDF base point.
         */
        if (
          originMode
        ) {
          dispatch(
            setPageOrigin({
              pageIndex:
                currentPage,

              x:
                point.x,

              y:
                point.y,
            }),
          );

          dispatch(
            setOriginMode(
              false,
            ),
          );

          emitCoordinate(
            point,
          );

          return;
        }

        if (
          activeTool ===
            'select' &&
          !hitTest(
            point.x,
            point.y,
          )
        ) {
          selectionStart =
            point;
        }

        const state =
          store.getState();

        const structural =
          isStructuralTool(
            activeTool,
          );

        let snappedPoint =
          point;

        if (
          structural
        ) {
          const structuralElements =
            getStructuralElements();

          const snap =
            findSnapPoint(
              point,
              structuralElements,
              pdfScale,
              {
                enabled:
                  state.ui
                    .snapEnabled,

                gridSize:
                  state.ui
                    .gridSize,

                types:
                  state.ui
                    .snapTypes,
              },
            );

          snappedPoint =
            snap?.point ??
            point;
        }

        setSnapPoint(
          null,
        );

        tool.onMouseDown(
          {
            x:
              snappedPoint.x,

            y:
              snappedPoint.y,

            rawEvent:
              event,
          },

          getCtx(),
        );
      };

    const handleMouseMove =
      (
        event: MouseEvent,
      ) => {
        const point =
          coords(event);

        /*
         * Engineering coordinate
         * is emitted on EVERY hover.
         */
        emitCoordinate(
          point,
        );

        if (
          selectionStart
        ) {
          setSelectionRect?.({
            x:
              Math.min(
                selectionStart.x,
                point.x,
              ),

            y:
              Math.min(
                selectionStart.y,
                point.y,
              ),

            width:
              Math.abs(
                point.x -
                  selectionStart.x,
              ),

            height:
              Math.abs(
                point.y -
                  selectionStart.y,
              ),
          });
        }

        const state =
          store.getState();

        const structural =
          isStructuralTool(
            activeTool,
          );

        let snapPoint:
          | {
              x: number;
              y: number;
            }
          | null = null;

        if (
          structural
        ) {
          const structuralElements =
            getStructuralElements();

          const snap =
            findSnapPoint(
              point,
              structuralElements,
              pdfScale,
              {
                enabled:
                  state.ui
                    .snapEnabled,

                gridSize:
                  state.ui
                    .gridSize,

                types:
                  state.ui
                    .snapTypes,
              },
            );

          snapPoint =
            snap?.point ??
            null;
        }

        setSnapPoint(
          snapPoint,
        );

        const toolPoint =
          snapPoint ??
          point;

        tool.onMouseMove(
          {
            x:
              toolPoint.x,

            y:
              toolPoint.y,

            rawEvent:
              event,
          },

          getCtx(),
        );
      };

    const handleMouseLeave =
      () => {
        emitCursorCoordinateClear();

        setSnapPoint(
          null,
        );
      };

    const handleMouseUp =
      (
        event: MouseEvent,
      ) => {
        const point =
          coords(event);

        selectionStart =
          null;

        setSelectionRect?.(
          null,
        );

        tool.onMouseUp(
          {
            x:
              point.x,

            y:
              point.y,

            rawEvent:
              event,
          },

          getCtx(),
        );

        if (
          activeTool !==
            'beam' &&
          activeTool !==
            'wall' &&
          activeTool !==
            'portalFrame'
        ) {
          setSnapPoint(
            null,
          );
        }
      };

    const handleDoubleClick =
      (
        event: MouseEvent,
      ) => {
        const point =
          coords(event);

        if (
          activeTool ===
          'select'
        ) {
          openProperties?.(
            hitTest(
              point.x,
              point.y,
            ),
          );

          return;
        }

        tool.onDblClick?.(
          {
            x:
              point.x,

            y:
              point.y,

            rawEvent:
              event,
          },

          getCtx(),
        );
      };

    const isTyping =
      (
        target:
          EventTarget | null,
      ): boolean => {
        const element =
          target as
            | HTMLElement
            | null;

        if (!element) {
          return false;
        }

        return (
          [
            'INPUT',
            'TEXTAREA',
            'SELECT',
          ].includes(
            element.tagName,
          ) ||
          !!element.closest(
            '[contenteditable="true"]',
          )
        );
      };

    const handleKeyDown =
      (
        event: KeyboardEvent,
      ) => {
        if (
          isTyping(
            event.target,
          )
        ) {
          return;
        }

        if (
          event.key ===
            'Escape' &&
          originMode
        ) {
          dispatch(
            setOriginMode(
              false,
            ),
          );

          return;
        }

        if (
          event.key ===
            'Delete' ||
          event.key ===
            'Backspace'
        ) {
          event.preventDefault();

          dispatch(
            deleteSelected(),
          );

          return;
        }

        const key =
          event.key.toLowerCase();

        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          key === 'c'
        ) {
          event.preventDefault();

          dispatch(
            copySelected(),
          );

          return;
        }

        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          key === 'v'
        ) {
          event.preventDefault();

          dispatch(
            pasteClipboard(),
          );

          return;
        }

        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          key === 'z'
        ) {
          event.preventDefault();

          dispatch(
            event.shiftKey
              ? redo()
              : undo(),
          );

          return;
        }

        if (
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const toolMap:
            Record<
              string,
              string
            > = {
              v: 'select',
              c: 'column',
              b: 'beam',
              w: 'wall',
              s: 'slab',
              p: 'portalFrame',
              m: 'measure',
            };

          const nextTool =
            toolMap[key];

          if (
            nextTool
          ) {
            event.preventDefault();

            dispatch(
              setActiveTool(
                nextTool as any,
              ),
            );

            return;
          }
        }

        tool.onKeyDown?.(
          event,
          getCtx(),
        );
      };

    canvas.addEventListener(
      'mousedown',
      handleMouseDown,
    );

    canvas.addEventListener(
      'mousemove',
      handleMouseMove,
    );

    canvas.addEventListener(
      'mouseup',
      handleMouseUp,
    );

    canvas.addEventListener(
      'mouseleave',
      handleMouseLeave,
    );

    canvas.addEventListener(
      'dblclick',
      handleDoubleClick,
    );

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      canvas.removeEventListener(
        'mousedown',
        handleMouseDown,
      );

      canvas.removeEventListener(
        'mousemove',
        handleMouseMove,
      );

      canvas.removeEventListener(
        'mouseup',
        handleMouseUp,
      );

      canvas.removeEventListener(
        'mouseleave',
        handleMouseLeave,
      );

      canvas.removeEventListener(
        'dblclick',
        handleDoubleClick,
      );

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      emitCursorCoordinateClear();
    };
  }, [
    activeTool,
    pdfScale,
    currentPage,
    coordinateSystem,
    originMode,
    dispatch,
    hitTest,
    tempShape,
    setTempShape,
    showTextDialog,
    canvasRef,
    setSnapPoint,
    openProperties,
    setSelectionRect,
  ]);
}