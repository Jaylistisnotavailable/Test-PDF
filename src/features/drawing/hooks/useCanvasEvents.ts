// src/features/drawing/hooks/useCanvasEvents.ts

import { useEffect, RefObject } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { store } from '@/app/store';
import { addShape, updateShape, selectShape, clearSelection, deleteSelected, beginHistoryTransaction, endHistoryTransaction, copySelected, pasteClipboard, setActiveTool, undo, redo } from '@/app/store/slices/drawingSlice';
import { setPageOrigin, selectPageCoordinateSystem, selectOriginMode, setOriginMode } from '@/app/store/slices/pageCoordinateSlice';
import type { Shape } from '@/app/store/slices/drawingSlice';
import type { StructuralElement } from '../elements/elementTypes';
import { BaseTool, ToolContext } from '../tools/BaseTool';
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
import { screenToPage } from '@/core/coordinate/coordinateUtils';
import { pagePointToEngineeringUnit } from '@/core/coordinate/pageCoordinateSystem';
import { emitCursorCoordinate, emitCursorCoordinateClear } from '@/core/coordinate/coordinateEvents';

// Mapping of tool IDs to their corresponding tool instances. Each tool is responsible for handling mouse and keyboard events on the canvas.
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

// Type guard to check if a shape is a StructuralElement. This is used to differentiate between legacy shapes and structural elements in the drawing application.
function isStructuralElement(shape: Shape): shape is StructuralElement {
  return (
    shape.type === 'column' ||
    shape.type === 'beam' ||
    shape.type === 'wall' ||
    shape.type === 'slab' ||
    shape.type === 'portalFrame'
  );
}

function isStructuralTool(tool: string): boolean {
  return tool === 'column' || tool === 'beam' || tool === 'wall' || tool === 'portalFrame';
}

/**
 * Custom React hook to manage canvas events for drawing tools.
 * @param canvasRef - Reference to the HTML canvas element.
 * @param hitTest - Function to perform hit testing on shapes.
 * @param tempShape - Temporary shape being drawn or manipulated.
 * @param setTempShape - Function to update the temporary shape state.
 * @param showTextDialog - Function to display a text input dialog at a specific position.
 * @param setSnapPoint - Function to set the current snap point for snapping behavior.
 * @param openProperties - Optional function to open properties dialog for a shape.
 * @param setSelectionRect - Optional function to set the selection rectangle for multi-select.
 */
export function useCanvasEvents(
  canvasRef: RefObject<HTMLCanvasElement>,
  hitTest: (x: number, y: number) => Shape | null,
  tempShape: Shape | null,
  setTempShape: (shape: Shape | null) => void,
  showTextDialog: (x: number, y: number) => void,
  setSnapPoint: (point: { x: number; y: number } | null) => void,
  openProperties?: (shape: Shape | null) => void,
  setSelectionRect?: (rect: { x: number; y: number; width: number; height: number } | null) => void,
) {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector((state) => state.drawing.activeTool);
  const pdfScale = useAppSelector((state) => state.pdf.scale);
  const currentPage = useAppSelector((state) => state.pdf.currentPage);
  const coordinateSystem = useAppSelector((state) => selectPageCoordinateSystem(state, currentPage));
  const originMode = useAppSelector(selectOriginMode);

  // Effect to set up and clean up event listeners for canvas interactions.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Helper function to convert screen coordinates to page coordinates based on the canvas bounding rectangle and current PDF scale.
    const coords = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return screenToPage(
        { x: event.clientX, y: event.clientY },
        rect,
        pdfScale,
      );
    };

    // Function to emit the current cursor coordinates in both page and engineering units. This is useful for displaying cursor position in the UI or for snapping calculations.
    const emitCoordinate = (point: { x: number; y: number }) => {
      const engineering = pagePointToEngineeringUnit(point, coordinateSystem);
      emitCursorCoordinate({
        pageIndex: currentPage,
        pagePoint: point,
        engineeringPoint: engineering,
        unit: coordinateSystem.unit,
        scaleNumerator: coordinateSystem.scaleNumerator,
        scaleDenominator: coordinateSystem.scaleDenominator,
      });
    };

    // Function to create a ToolContext object that provides access to the Redux store, current PDF scale, temporary shape state, and various utility functions for manipulating shapes and selection.
    const getCtx = (): ToolContext => ({
      dispatch,
      getState: store.getState,
      pdfScale,
      tempShape,
      setTempShape,
      hitTest,
      showTextDialog,
      addShape: (shape) => dispatch(addShape(shape)),
      updateShape: (id, changes) => dispatch(updateShape({ id, changes })),
      selectShape: (id, multiSelect) => dispatch(selectShape({ id, multiSelect })),
      clearSelection: () => dispatch(clearSelection()),
      deleteSelected: () => dispatch(deleteSelected()),
      beginHistory: () => dispatch(beginHistoryTransaction()),
      endHistory: () => dispatch(endHistoryTransaction()),
    });

    // Set the cursor style of the canvas based on the active tool and whether the origin mode is enabled. The cursor changes to a crosshair when in origin mode or when using tools that require precise placement.
    const tool = toolInstances[activeTool] ?? toolInstances.select;
    canvas.style.cursor = originMode ? 'crosshair' : tool.cursor;

    // Variable to track the starting point of a selection rectangle when using the select tool. This is used to create a visual selection box for multi-selecting shapes on the canvas.
    let selectionStart: { x: number; y: number } | null = null;

    // Function to retrieve all structural elements on the current page. This is used for snapping calculations and for determining which shapes are relevant for certain tools.
    const getStructuralElements = (): StructuralElement[] => {
      const state = store.getState();
      return state.drawing.shapes.filter(
        (shape): shape is StructuralElement =>
          shape.pageIndex === state.pdf.currentPage && isStructuralElement(shape),
      );
    };

    // Event handler for mouse down events on the canvas. This function handles initiating drawing or selection based on the active tool, snapping to nearby points if applicable, and managing the origin mode for setting a reference point.
    const handleMouseDown = (event: MouseEvent) => {
      const point = coords(event);
      if (originMode) {
        dispatch(setPageOrigin({ pageIndex: currentPage, x: point.x, y: point.y }));
        dispatch(setOriginMode(false));
        emitCoordinate(point);
        return;
      }
      if (activeTool === 'select' && !hitTest(point.x, point.y)) {
        selectionStart = point;
      }
      const state = store.getState();
      const structural = isStructuralTool(activeTool);
      let snappedPoint = point;
      if (structural) {
        const structuralElements = getStructuralElements();
        const snap = findSnapPoint(point, structuralElements, pdfScale, {
          enabled: state.ui.snapEnabled,
          gridSize: state.ui.gridSize,
          types: state.ui.snapTypes,
        });
        snappedPoint = snap?.point ?? point;
      }
      setSnapPoint(null);
      tool.onMouseDown(
        { x: snappedPoint.x, y: snappedPoint.y, rawEvent: event },
        getCtx(),
      );
    };

    // Event handler for mouse move events on the canvas. This function updates the cursor coordinates, manages the selection rectangle if the select tool is active, and handles snapping behavior for structural tools.
    const handleMouseMove = (event: MouseEvent) => {
      const point = coords(event);
      emitCoordinate(point);
      if (selectionStart) {
        setSelectionRect?.({
          x: Math.min(selectionStart.x, point.x),
          y: Math.min(selectionStart.y, point.y),
          width: Math.abs(point.x - selectionStart.x),
          height: Math.abs(point.y - selectionStart.y),
        });
      }
      const state = store.getState();
      const structural = isStructuralTool(activeTool);
      let snapPoint: { x: number; y: number } | null = null;
      if (structural) {
        const structuralElements = getStructuralElements();
        const snap = findSnapPoint(point, structuralElements, pdfScale, {
          enabled: state.ui.snapEnabled,
          gridSize: state.ui.gridSize,
          types: state.ui.snapTypes,
        });
        snapPoint = snap?.point ?? null;
      }
      setSnapPoint(snapPoint);
      const toolPoint = snapPoint ?? point;
      tool.onMouseMove(
        { x: toolPoint.x, y: toolPoint.y, rawEvent: event },
        getCtx(),
      );
    };

    // Event handler for mouse leave events on the canvas. This function clears the cursor coordinates and resets the snap point when the mouse leaves the canvas area.
    const handleMouseLeave = () => {
      emitCursorCoordinateClear();
      setSnapPoint(null);
    };

    const handleMouseUp = (event: MouseEvent) => {
      const point = coords(event);
      selectionStart = null;
      setSelectionRect?.(null);
      tool.onMouseUp(
        { x: point.x, y: point.y, rawEvent: event },
        getCtx(),
      );
      if (activeTool !== 'beam' && activeTool !== 'wall' && activeTool !== 'portalFrame') {
        setSnapPoint(null);
      }
    };

    // Event handler for double-click events on the canvas. This function allows tools to handle double-click actions, such as finalizing a shape or opening a properties dialog for a selected shape.
    const handleDoubleClick = (event: MouseEvent) => {
      const point = coords(event);
      if (activeTool === 'select') {
        openProperties?.(hitTest(point.x, point.y));
        return;
      }
      tool.onDblClick?.(
        { x: point.x, y: point.y, rawEvent: event },
        getCtx(),
      );
    };

    // Helper function to determine if the user is currently typing in an input field, textarea, or contenteditable element. This is used to prevent keyboard shortcuts from interfering with text input.
    const isTyping = (target: EventTarget | null): boolean => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      return (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) ||
        !!element.closest('[contenteditable="true"]')
      );
    };

    // Event handler for key down events on the window. This function handles keyboard shortcuts for undo, redo, copy, paste, delete, and switching between tools. It also delegates key down events to the active tool for custom behavior.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      if (event.key === 'Escape' && originMode) {
        dispatch(setOriginMode(false));
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        dispatch(deleteSelected());
        return;
      }
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'c') {
        event.preventDefault();
        dispatch(copySelected());
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === 'v') {
        event.preventDefault();
        dispatch(pasteClipboard());
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault();
        dispatch(event.shiftKey ? redo() : undo());
        return;
      }
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        const toolMap: Record<string, string> = {
          v: 'select',
          c: 'column',
          b: 'beam',
          w: 'wall',
          s: 'slab',
          p: 'portalFrame',
          m: 'measure',
        };
        const nextTool = toolMap[key];
        if (nextTool) {
          event.preventDefault();
          dispatch(setActiveTool(nextTool as any));
          return;
        }
      }
      tool.onKeyDown?.(event, getCtx());
    };

    // Add event listeners for mouse and keyboard events on the canvas and window. These listeners handle user interactions with the drawing tools and manage the state of the application accordingly.
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('keydown', handleKeyDown);
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