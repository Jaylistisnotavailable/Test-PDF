import {
  BaseTool,
  CanvasEvent,
  ToolContext,
} from './BaseTool';

import {
  STRUCTURAL_DEFAULTS,
} from '../elements/elementDefaults';

import {
  makeBase,
  ensureLabel,
} from './structuralToolUtils';

export class ColumnTool extends BaseTool {
  cursor = 'crosshair';

  onMouseDown(
    e: CanvasEvent,
    ctx: ToolContext,
  ) {
    const d = STRUCTURAL_DEFAULTS.column;

    const label = ensureLabel(
      ctx,
      'column',
    );

    ctx.addShape({
      ...makeBase(
        ctx,
        'column',
        {
          x: e.x - d.width / 2,
          y: e.y - d.depth / 2,
          width: d.width,
          depth: d.depth,
          rotation: d.rotation,
        },
      ),

      label,

      properties: {
        label,

        // Real engineering dimensions.
        section: `${d.realWidth}×${d.realDepth}`,

        material: d.material,
      },
    } as any);
  }

  onMouseMove() {}

  onMouseUp() {}
}