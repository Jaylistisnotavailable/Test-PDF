import { useEffect, RefObject } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { addShape, updateShape, selectShape, clearSelection, deleteSelected } from '@/app/store/slices/drawingSlice';
import type { Shape } from '@/app/store/slices/drawingSlice';
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

const toolInstances: Record<string, BaseTool> = {
  select: new SelectTool(), point: new PointTool(), line: new LineTool(),
  polyline: new PolylineTool(), polygon: new PolygonTool(), rectangle: new RectangleTool(),
  circle: new CircleTool(), text: new TextTool(), measure: new MeasureTool(), eraser: new EraserTool()
};

export function useCanvasEvents(
  canvasRef: RefObject<HTMLCanvasElement>,
  hitTest: (x: number, y: number) => Shape | null,
  tempShape: Shape | null,
  setTempShape: (s: Shape | null) => void,
  showTextDialog: (x: number, y: number) => void
) {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector(state => state.drawing.activeTool);
  const pdfScale = useAppSelector(state => state.pdf.scale);
  const getState = useAppSelector(state => state); // 简化：直接获取整个 state

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getLogicalCoords = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / pdfScale,
        y: (e.clientY - rect.top) / pdfScale
      };
    };

    const getCtx = (): ToolContext => ({
      dispatch, getState: () => getState as any, pdfScale, tempShape, setTempShape, hitTest, showTextDialog,
      addShape: (s) => dispatch(addShape(s)),
      updateShape: (id, c) => dispatch(updateShape({ id, changes: c })),
      selectShape: (id, m) => dispatch(selectShape({ id, multiSelect: m })),
      clearSelection: () => dispatch(clearSelection()),
      deleteSelected: () => dispatch(deleteSelected())
    });

    const tool = toolInstances[activeTool];
    canvas.style.cursor = tool.cursor;

    const handleMouseDown = (e: MouseEvent) => {
      const { x, y } = getLogicalCoords(e);
      tool.onMouseDown({ x, y, rawEvent: e }, getCtx());
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getLogicalCoords(e);
      tool.onMouseMove({ x, y, rawEvent: e }, getCtx());
    };

    const handleMouseUp = (e: MouseEvent) => {
      const { x, y } = getLogicalCoords(e);
      tool.onMouseUp({ x, y, rawEvent: e }, getCtx());
    };

    const handleDblClick = (e: MouseEvent) => {
      const { x, y } = getLogicalCoords(e);
      tool.onDblClick?.({ x, y, rawEvent: e }, getCtx());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      tool.onKeyDown?.(e, getCtx());
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDblClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTool, pdfScale, dispatch, getState, hitTest, tempShape, setTempShape, showTextDialog, canvasRef]);
}
