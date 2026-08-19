import { BaseTool, CanvasEvent, ToolContext } from './BaseTool';
import { distance } from '../utils/geometry';
import type { MeasureShape } from '@/app/store/slices/drawingSlice';

export class MeasureTool extends BaseTool {
  cursor = 'crosshair';
  private startPoint: { x: number; y: number } | null = null;

  onMouseDown(e: CanvasEvent, ctx: ToolContext) {
    this.startPoint = { x: e.x, y: e.y };
    const rootState = ctx.getState();
    const activeLayerId = rootState.layer.activeLayerId;
    const drawingState = rootState.drawing;

    ctx.setTempShape({
      id: 'temp', 
      type: 'measure', 
      points: [e.x, e.y, e.x, e.y], 
      realLength: 0,
      unit: drawingState.scaleUnit, 
      scaleRatio: `${drawingState.scaleNumerator}:${drawingState.scaleDenominator}`,
      layerId: activeLayerId, 
      pageIndex: rootState.pdf.currentPage,
      color: drawingState.currentStrokeColor, 
      strokeWidth: drawingState.currentStrokeWidth, 
      opacity: drawingState.currentOpacity,
      createdAt: '', 
      updatedAt: ''
    } as MeasureShape);
  }

  onMouseMove(e: CanvasEvent, ctx: ToolContext) {
    if (this.startPoint && ctx.tempShape) {
      // 【修复】：断言 tempShape 为 MeasureShape
      const currentShape = ctx.tempShape as MeasureShape;
      const pts = [this.startPoint.x, this.startPoint.y, e.x, e.y];
      const pixelLen = distance(pts[0], pts[1], pts[2], pts[3]);
      const drawingState = ctx.getState().drawing;
      const realLen = pixelLen * (drawingState.scaleNumerator / drawingState.scaleDenominator);
      
      ctx.setTempShape({ 
        ...currentShape, 
        points: pts, 
        realLength: parseFloat(realLen.toFixed(2)) 
      } as MeasureShape); // 断言为 MeasureShape
    }
  }

  onMouseUp(e: CanvasEvent, ctx: ToolContext) {
    if (ctx.tempShape) {
      ctx.addShape(ctx.tempShape);
      ctx.setTempShape(null);
    }
    this.startPoint = null;
  }
}