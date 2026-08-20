import { BaseTool, CanvasEvent, ToolContext } from './BaseTool';
import { makeBase, ensureLabel } from './structuralToolUtils';
import { getStructuralDefaults } from '../elements/elementDefaults';

export class PortalFrameTool extends BaseTool {
  cursor = 'crosshair';
  private start: { x: number; y: number } | null = null;

  onMouseDown(e: CanvasEvent, ctx: ToolContext) {
    if (this.start) return;
    this.start = { x: e.x, y: e.y };

    const scale = ctx.getState().drawing.scaleDenominator;
    const d = getStructuralDefaults(scale, ctx.getState().drawing.scaleNumerator).portalFrame;
    const label = ensureLabel(ctx, 'portalFrame');

    ctx.setTempShape({
      ...makeBase(ctx, 'portalFrame', {
        start: e,
        end: e,
        height: d.height,
        columnWidth: d.columnWidth,
        columnDepth: d.columnDepth,
        beamWidth: d.beamWidth,
        beamDepth: d.beamDepth,
      }),
      label,
      properties: {
        label,
        section: d.section,
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
