import { BaseTool, CanvasEvent, ToolContext } from './BaseTool';
import { makeBase, ensureLabel } from './structuralToolUtils';
import { getStructuralDefaults } from '../elements/elementDefaults';

export class ColumnTool extends BaseTool {
  cursor = 'crosshair';

  onMouseDown(e: CanvasEvent, ctx: ToolContext) {
    const scale = ctx.getState().drawing.scaleDenominator;
    const d = getStructuralDefaults(scale, ctx.getState().drawing.scaleNumerator).column;
    const label = ensureLabel(ctx, 'column');

    ctx.addShape({
      ...makeBase(ctx, 'column', {
        x: e.x - d.width / 2,
        y: e.y - d.depth / 2,
        width: d.width,
        depth: d.depth,
        rotation: d.rotation,
      }),
      label,
      properties: {
        label,
        section: `${d.realWidth}×${d.realDepth}`,
        material: d.material,
      },
    } as any);
  }

  onMouseMove() {}
  onMouseUp() {}
}
