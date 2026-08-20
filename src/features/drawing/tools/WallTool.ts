import { BaseTool, CanvasEvent, ToolContext } from './BaseTool';
import { makeBase, ensureLabel } from './structuralToolUtils';
import { getStructuralDefaults } from '../elements/elementDefaults';

export class WallTool extends BaseTool {
  cursor = 'crosshair';
  private start: { x: number; y: number } | null = null;

  onMouseDown(e: CanvasEvent, ctx: ToolContext) {
    if (this.start) return;

    this.start = { x: e.x, y: e.y };
    const scale = ctx.getState().drawing.scaleDenominator;
    const d = getStructuralDefaults(scale, ctx.getState().drawing.scaleNumerator).wall;
    const label = ensureLabel(ctx, 'wall');

    ctx.setTempShape({
      ...makeBase(ctx, 'wall', {
        start: e,
        end: e,
        thickness: d.thickness,
      }),
      label,
      properties: {
        label,
        wallType: d.wallType,
        material: d.material,
      },
    } as any);
  }

  onMouseMove(e: CanvasEvent, ctx: ToolContext) {
    if (this.start && ctx.tempShape) {
      ctx.setTempShape({
        ...ctx.tempShape,
        geometry: {
          ...(ctx.tempShape as any).geometry,
          end: { x: e.x, y: e.y },
        },
      } as any);
    }
  }

  onMouseUp(e: CanvasEvent, ctx: ToolContext) {
    if (this.start && ctx.tempShape) {
      ctx.addShape({
        ...ctx.tempShape,
        geometry: {
          ...(ctx.tempShape as any).geometry,
          end: { x: e.x, y: e.y },
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
