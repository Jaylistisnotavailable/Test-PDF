import { useEffect, RefObject } from 'react';

import {
  useAppDispatch,
  useAppSelector,
} from '@/app/store/hooks';

import { store } from '@/app/store';

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

import type { Shape } from '@/app/store/slices/drawingSlice';

import type {
  StructuralElement,
} from '../elements/elementTypes';

import {
  BaseTool,
  ToolContext,
} from '../tools/BaseTool';

import { SelectTool } from '../tools/SelectTool';
import { PointTool } from '../tools/PointTool';
import { LineTool } from '../tools/LineTool';
import { PolylineTool } from '../tools/PolylineTool';
import { PolygonTool } from '../tools/PolygonTool';
import { RectangleTool } from '../tools/RectangleTool';
import { CircleTool } from '../tools/CircleTool';
import { TextTool } from '../tools/TextTool';
import { MeasureTool } from '../tools/MeasureTool';
import { EraserTool } from '../tools/EraserTool';

import { ColumnTool } from '../tools/ColumnTool';
import { BeamTool } from '../tools/BeamTool';
import { WallTool } from '../tools/WallTool';
import { SlabTool } from '../tools/SlabTool';
import { PortalFrameTool } from '../tools/PortalFrameTool';

import { findSnapPoint } from '../snapping/snapEngine';


/* -------------------------------------------------------------------------- */
/* Tool instances                                                            */
/* -------------------------------------------------------------------------- */

const toolInstances: Record<string, BaseTool> = {
  select: new SelectTool(),

  column: new ColumnTool(),
  beam: new BeamTool(),
  wall: new WallTool(),
  slab: new SlabTool(),
  portalFrame: new PortalFrameTool(),

  point: new PointTool(),
  line: new LineTool(),
  polyline: new PolylineTool(),
  polygon: new PolygonTool(),
  rectangle: new RectangleTool(),
  circle: new CircleTool(),
  text: new TextTool(),
  measure: new MeasureTool(),
  eraser: new EraserTool(),
};


/* -------------------------------------------------------------------------- */
/* Structural element type guard                                             */
/* -------------------------------------------------------------------------- */

/**
 * Determines whether a Shape is a structural element.
 *
 * Shape is a union of:
 *
 *   LegacyShape | StructuralElement
 *
 * Therefore we must narrow the union before passing shapes to functions
 * such as findSnapPoint(), which require StructuralElement[].
 */
function isStructuralElement(
  shape: Shape,
): shape is StructuralElement {
  return (
    shape.type === 'column' ||
    shape.type === 'beam' ||
    shape.type === 'wall' ||
    shape.type === 'slab' ||
    shape.type === 'portalFrame'
  );
}


/* -------------------------------------------------------------------------- */
/* Structural tool helper                                                     */
/* -------------------------------------------------------------------------- */

function isStructuralTool(
  tool: string,
): boolean {
  return (
    tool === 'column' ||
    tool === 'beam' ||
    tool === 'wall' ||
    tool === 'slab' ||
    tool === 'portalFrame'
  );
}


/* -------------------------------------------------------------------------- */
/* Hook                                                                      */
/* -------------------------------------------------------------------------- */

export function useCanvasEvents(
  canvasRef: RefObject<HTMLCanvasElement>,

  hitTest: (
    x: number,
    y: number,
  ) => Shape | null,

  tempShape: Shape | null,

  setTempShape: (
    shape: Shape | null,
  ) => void,

  showTextDialog: (
    x: number,
    y: number,
  ) => void,

  setSnapPoint: (
    point: { x: number; y: number } | null,
  ) => void,

  openProperties?: (
    shape: Shape | null,
  ) => void,

  setSelectionRect?: (
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null,
  ) => void,
) {
  const dispatch = useAppDispatch();

  const activeTool = useAppSelector(
    (state) => state.drawing.activeTool,
  );

  const pdfScale = useAppSelector(
    (state) => state.pdf.scale,
  );


  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }


    /* ---------------------------------------------------------------------- */
    /* Coordinate conversion                                                  */
    /* ---------------------------------------------------------------------- */

    const coords = (event: MouseEvent) => {
      const rect =
        canvas.getBoundingClientRect();

      const scale =
        Math.max(pdfScale, 0.0001);

      return {
        x:
          (event.clientX - rect.left) /
          scale,

        y:
          (event.clientY - rect.top) /
          scale,
      };
    };


    /* ---------------------------------------------------------------------- */
    /* Tool context                                                            */
    /* ---------------------------------------------------------------------- */

    const getCtx = (): ToolContext => ({
      dispatch,

      getState: store.getState,

      pdfScale,

      tempShape,

      setTempShape,

      hitTest,

      showTextDialog,

      addShape: (shape) => {
        dispatch(
          addShape(shape),
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


    /* ---------------------------------------------------------------------- */
    /* Active tool                                                             */
    /* ---------------------------------------------------------------------- */

    const tool =
      toolInstances[activeTool] ??
      toolInstances.select;

    canvas.style.cursor =
      tool.cursor;


    /* ---------------------------------------------------------------------- */
    /* Selection rectangle                                                    */
    /* ---------------------------------------------------------------------- */

    let selectionStart:
      | { x: number; y: number }
      | null = null;


    /* ---------------------------------------------------------------------- */
    /* Structural snap elements                                               */
    /* ---------------------------------------------------------------------- */

    const getStructuralElements =
      (): StructuralElement[] => {
        const state =
          store.getState();

        return state.drawing.shapes.filter(
          (
            shape,
          ): shape is StructuralElement =>
            shape.pageIndex ===
              state.pdf.currentPage &&
            isStructuralElement(shape),
        );
      };


    /* ---------------------------------------------------------------------- */
    /* Mouse down                                                              */
    /* ---------------------------------------------------------------------- */

    const handleMouseDown = (
      event: MouseEvent,
    ) => {
      const point =
        coords(event);


      if (
        activeTool === 'select' &&
        !hitTest(
          point.x,
          point.y,
        )
      ) {
        selectionStart = point;
      }


      const state =
        store.getState();

      const structural =
        isStructuralTool(
          activeTool,
        );


      let snappedPoint =
        point;


      if (structural) {
        const structuralElements =
          getStructuralElements();

        const snap =
          findSnapPoint(
            point,
            structuralElements,
            pdfScale,
            {
              enabled:
                state.ui.snapEnabled,

              gridSize:
                state.ui.gridSize,

              types:
                state.ui.snapTypes,
            },
          );

        snappedPoint =
          snap?.point ?? point;
      }


      setSnapPoint(
        null,
      );


      tool.onMouseDown(
        {
          x: snappedPoint.x,
          y: snappedPoint.y,
          rawEvent: event,
        },
        getCtx(),
      );
    };


    /* ---------------------------------------------------------------------- */
    /* Mouse move                                                              */
    /* ---------------------------------------------------------------------- */

    const handleMouseMove = (
      event: MouseEvent,
    ) => {
      const point =
        coords(event);


      /* Selection rectangle */
      if (selectionStart) {
        setSelectionRect?.({
          x: Math.min(
            selectionStart.x,
            point.x,
          ),

          y: Math.min(
            selectionStart.y,
            point.y,
          ),

          width: Math.abs(
            point.x -
              selectionStart.x,
          ),

          height: Math.abs(
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
        | { x: number; y: number }
        | null = null;


      if (structural) {
        const structuralElements =
          getStructuralElements();

        const snap =
          findSnapPoint(
            point,
            structuralElements,
            pdfScale,
            {
              enabled:
                state.ui.snapEnabled,

              gridSize:
                state.ui.gridSize,

              types:
                state.ui.snapTypes,
            },
          );

        snapPoint =
          snap?.point ?? null;
      }


      setSnapPoint(
        snapPoint,
      );


      const toolPoint =
        snapPoint ?? point;


      tool.onMouseMove(
        {
          x: toolPoint.x,
          y: toolPoint.y,
          rawEvent: event,
        },
        getCtx(),
      );
    };


    /* ---------------------------------------------------------------------- */
    /* Mouse up                                                                */
    /* ---------------------------------------------------------------------- */

    const handleMouseUp = (
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
          x: point.x,
          y: point.y,
          rawEvent: event,
        },
        getCtx(),
      );


      if (
        activeTool !== 'beam' &&
        activeTool !== 'wall' &&
        activeTool !== 'portalFrame'
      ) {
        setSnapPoint(
          null,
        );
      }
    };


    /* ---------------------------------------------------------------------- */
    /* Double click                                                            */
    /* ---------------------------------------------------------------------- */

    const handleDoubleClick = (
      event: MouseEvent,
    ) => {
      const point =
        coords(event);


      if (
        activeTool === 'select'
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
          x: point.x,
          y: point.y,
          rawEvent: event,
        },
        getCtx(),
      );
    };


    /* ---------------------------------------------------------------------- */
    /* Text input detection                                                    */
    /* ---------------------------------------------------------------------- */

    const isTyping = (
      target: EventTarget | null,
    ): boolean => {
      const element =
        target as HTMLElement | null;

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


    /* ---------------------------------------------------------------------- */
    /* Keyboard events                                                         */
    /* ---------------------------------------------------------------------- */

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        isTyping(
          event.target,
        )
      ) {
        return;
      }


      /* Delete */
      if (
        event.key === 'Delete' ||
        event.key === 'Backspace'
      ) {
        event.preventDefault();

        dispatch(
          deleteSelected(),
        );

        return;
      }


      const key =
        event.key.toLowerCase();


      /* Copy */
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        key === 'c'
      ) {
        event.preventDefault();

        dispatch(
          copySelected(),
        );

        return;
      }


      /* Paste */
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        key === 'v'
      ) {
        event.preventDefault();

        dispatch(
          pasteClipboard(),
        );

        return;
      }


      /* Undo / redo */
      if (
        (event.ctrlKey ||
          event.metaKey) &&
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


      /* Tool shortcuts */
      if (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const toolMap:
          Record<string, string> = {
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


        if (nextTool) {
          event.preventDefault();

          dispatch(
            setActiveTool(
              nextTool as any,
            ),
          );

          return;
        }
      }


      /* Allow the active tool to process
         additional keyboard commands. */
      tool.onKeyDown?.(
        event,
        getCtx(),
      );
    };


    /* ---------------------------------------------------------------------- */
    /* Event registration                                                      */
    /* ---------------------------------------------------------------------- */

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
      'dblclick',
      handleDoubleClick,
    );

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );


    /* ---------------------------------------------------------------------- */
    /* Cleanup                                                                 */
    /* ---------------------------------------------------------------------- */

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
        'dblclick',
        handleDoubleClick,
      );

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [
    activeTool,
    pdfScale,
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
