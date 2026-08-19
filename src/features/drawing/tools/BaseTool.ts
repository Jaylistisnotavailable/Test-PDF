import type { AppDispatch, RootState } from '@/app/store';
import type { Shape } from '@/app/store/slices/drawingSlice';

export interface CanvasEvent {
  x: number; // 逻辑坐标 (已除以 pdfScale)
  y: number;
  rawEvent: React.MouseEvent | MouseEvent;
}

export interface ToolContext {
  dispatch: AppDispatch;
  getState: () => RootState;
  pdfScale: number;
  tempShape: Shape | null;
  setTempShape: (shape: Shape | null) => void;
  hitTest: (x: number, y: number) => Shape | null;
  showTextDialog: (x: number, y: number) => void;
  // Actions 快捷引用
  addShape: (shape: any) => void;
  updateShape: (id: string, changes: any) => void;
  selectShape: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
}

export abstract class BaseTool {
  abstract cursor: string;
  abstract onMouseDown(e: CanvasEvent, ctx: ToolContext): void;
  abstract onMouseMove(e: CanvasEvent, ctx: ToolContext): void;
  abstract onMouseUp(e: CanvasEvent, ctx: ToolContext): void;
  onDblClick?(e: CanvasEvent, ctx: ToolContext): void {}
  onKeyDown?(e: KeyboardEvent, ctx: ToolContext): void {}
}
