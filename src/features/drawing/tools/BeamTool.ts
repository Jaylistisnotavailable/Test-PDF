import { BaseTool, CanvasEvent, ToolContext } from './BaseTool';
import { makeBase, ensureLabel, getOrCreateNode, distance } from './structuralToolUtils';
import { getStructuralDefaults } from '../elements/elementDefaults';
import { resolveNode } from '../nodes/nodeUtils';

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
      const state = ctx.getState();

      // 1. 解析或创建起点节点
      const startNodeResult = resolveNode(this.start, state.drawing.shapes, {
        pageIndex: state.pdf.currentPage,
        layerId: state.layer.activeLayerId,
        tolerance: 2,
      });
      if (startNodeResult.isNew) ctx.addShape(startNodeResult.node as any);

      // 2. 解析或创建终点节点 (如果距离过近则复用起点节点)
      let endNodeResult = startNodeResult;
      if (Math.hypot(this.start.x - endPoint.x, this.start.y - endPoint.y) > 2) {
        endNodeResult = resolveNode(endPoint, state.drawing.shapes, {
          pageIndex: state.pdf.currentPage,
          layerId: state.layer.activeLayerId,
          tolerance: 2,
        });
        if (endNodeResult.isNew) ctx.addShape(endNodeResult.node as any);
      }

      // 3. 添加梁，并记录节点 ID
      ctx.addShape({
        ...ctx.tempShape,
        geometry: { ...(ctx.tempShape as any).geometry, end: endPoint },
        properties: {
          ...(ctx.tempShape as any).properties,
          startNodeId: startNodeResult.node.id,
          endNodeId: endNodeResult.node.id,
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