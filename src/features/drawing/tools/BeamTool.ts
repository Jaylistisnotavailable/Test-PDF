import { BaseTool, CanvasEvent, ToolContext } from './BaseTool';
import { makeBase, ensureLabel, getOrCreateNode, distance } from './structuralToolUtils';
import { getStructuralDefaults } from '../elements/elementDefaults';

export class BeamTool extends BaseTool {
  cursor = 'crosshair';
  private start: { x: number; y: number } | null = null;

  onMouseDown(e: CanvasEvent, ctx: ToolContext) {
    if (this.start) return;
    this.start = { x: e.x, y: e.y };
    const scale = ctx.getState().drawing.scaleDenominator;
    const d = getStructuralDefaults(scale, ctx.getState().drawing.scaleNumerator).beam;
    const label = ensureLabel(ctx, 'beam');

    ctx.setTempShape({
      ...makeBase(ctx, 'beam', { start: e, end: e, width: d.width, depth: d.depth }),
      label,
      properties: { label, section: `${d.realWidth}×${d.realDepth}`, material: d.material },
    } as any);
  }

  onMouseMove(e: CanvasEvent, ctx: ToolContext) {
    if (this.start && ctx.tempShape) {
      ctx.setTempShape({
        ...ctx.tempShape,
        geometry: { ...(ctx.tempShape as any).geometry, end: { x: e.x, y: e.y } },
      } as any);
    }
  }

  onMouseUp(e: CanvasEvent, ctx: ToolContext) {
    if (this.start && ctx.tempShape) {
      const endPoint = { x: e.x, y: e.y };
      
      // 处理起点节点
      const startNodeResult = getOrCreateNode(ctx, this.start, 2);
      if (startNodeResult.isNew && startNodeResult.shape) ctx.addShape(startNodeResult.shape);

      // 处理终点节点 (如果起点终点距离过近则复用同一个节点)
      let endNodeResult: ReturnType<typeof getOrCreateNode> | null = null;
      if (distance(this.start, endPoint) > 2) {
        endNodeResult = getOrCreateNode(ctx, endPoint, 2);
        if (endNodeResult.isNew && endNodeResult.shape) ctx.addShape(endNodeResult.shape);
      } else {
        endNodeResult = startNodeResult;
      }

      // 添加梁，并记录节点 ID
      ctx.addShape({
        ...ctx.tempShape,
        geometry: { ...(ctx.tempShape as any).geometry, end: endPoint },
        properties: {
          ...(ctx.tempShape as any).properties,
          startNodeId: startNodeResult.id,
          endNodeId: endNodeResult!.id,
        },
      } as any);

      ctx.setTempShape(null);
    }
    this.start = null;
  }

  onKeyDown(e: KeyboardEvent, ctx: ToolContext) {
    if (e.key === 'Escape') {
      this.start = null;
      ctx.setTempShape(null);
    }
  }
}