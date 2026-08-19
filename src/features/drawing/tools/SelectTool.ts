import { BaseTool, CanvasEvent, ToolContext } from './BaseTool';
import { getBounds } from '../utils/geometry';

export class SelectTool extends BaseTool {
  cursor = 'default';
  private dragStart: { x: number; y: number } | null = null;
  private initialPositions: Map<string, { x: number; y: number }> = new Map();

  onMouseDown(e: CanvasEvent, ctx: ToolContext) {
    const shape = ctx.hitTest(e.x, e.y);
    const isMulti = e.rawEvent.shiftKey;

    if (shape) {
      ctx.selectShape(shape.id, isMulti);
      this.dragStart = { x: e.x, y: e.y };
      this.initialPositions.clear();
      
      const selectedIds = ctx.getState().drawing.selectedShapeIds;
      ctx.getState().drawing.shapes.forEach(s => {
        if (selectedIds.includes(s.id)) {
          if ('x' in s) this.initialPositions.set(s.id, { x: (s as any).x, y: (s as any).y });
        }
      });
    } else {
      ctx.clearSelection();
    }
  }

  onMouseMove(e: CanvasEvent, ctx: ToolContext) {
    if (!this.dragStart) return;
    const dx = e.x - this.dragStart.x;
    const dy = e.y - this.dragStart.y;

    this.initialPositions.forEach((pos, id) => {
      ctx.updateShape(id, { x: pos.x + dx, y: pos.y + dy });
    });
  }

  onMouseUp(e: CanvasEvent, ctx: ToolContext) {
    this.dragStart = null;
    this.initialPositions.clear();
  }

  onKeyDown(e: KeyboardEvent, ctx: ToolContext) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      ctx.deleteSelected();
    }
  }
}