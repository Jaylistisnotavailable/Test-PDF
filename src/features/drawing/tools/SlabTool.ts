import { BaseTool, CanvasEvent, ToolContext } from './BaseTool';
import { getStructuralDefaults } from '../elements/elementDefaults';
import { makeBase, ensureLabel } from './structuralToolUtils';

export class SlabTool extends BaseTool {
  cursor = 'crosshair';

  onMouseDown(e: CanvasEvent, ctx: ToolContext) {
    const drawing = ctx.getState().drawing;
    const d = getStructuralDefaults(drawing.scaleDenominator, drawing.scaleNumerator).slab;
    const label = ensureLabel(ctx, 'slab');

    if (!ctx.tempShape) {
      ctx.setTempShape({
        ...makeBase(ctx, 'slab', { points: [e] }),
        label,
        properties: {
          label,
          thickness: d.realThickness,
          material: d.material,
          level: d.level,
        },
      } as any);
    } else {
      const pts = [...(ctx.tempShape as any).geometry.points];
      pts[pts.length - 1] = e;
      pts.push(e);
      ctx.setTempShape({ ...ctx.tempShape, geometry: { points: pts } } as any);
    }
  }

  onMouseMove(e: CanvasEvent, ctx: ToolContext) {
    if (ctx.tempShape) {
      const pts = [...(ctx.tempShape as any).geometry.points];
      if (pts.length) pts[pts.length - 1] = e;
      ctx.setTempShape({ ...ctx.tempShape, geometry: { points: pts } } as any);
    }
  }

  onMouseUp() {}

  onDblClick(_: CanvasEvent, ctx: ToolContext) {
    const shape: any = ctx.tempShape;
    if (!shape) return;
    const pts = shape.geometry.points.slice(0, -1);
    if (pts.length >= 3) ctx.addShape({ ...shape, geometry: { points: pts } } as any);
    ctx.setTempShape(null);
  }

  onKeyDown(e: KeyboardEvent, ctx: ToolContext) {
    if (e.key === 'Enter') this.onDblClick({ x: 0, y: 0, rawEvent: e as any }, ctx);
    if (e.key === 'Escape') ctx.setTempShape(null);
  }
}
