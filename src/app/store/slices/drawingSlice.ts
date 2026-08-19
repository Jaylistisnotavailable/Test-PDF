import { createSlice, PayloadAction, Middleware, isAnyOf, nanoid, UnknownAction, createAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// ================= Types =================
export type ToolType = 'select' | 'point' | 'line' | 'polyline' | 'polygon' 
                     | 'rectangle' | 'circle' | 'text' | 'measure' | 'eraser';

interface BaseShape {
  id: string;
  type: ToolType;
  layerId: string;
  pageId: number;
  color: string;
  strokeWidth: number;
  opacity: number;
  zIndex: number;
  fillColor?: string;
  fillOpacity?: number;
  label?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface PointShape extends BaseShape { type: 'point'; x: number; y: number; radius: number; }
export interface LineShape extends BaseShape { type: 'line'; points: [number, number, number, number]; }
export interface PolylineShape extends BaseShape { type: 'polyline'; points: number[]; }
export interface PolygonShape extends BaseShape { type: 'polygon'; points: number[]; }
export interface RectShape extends BaseShape { type: 'rectangle'; x: number; y: number; width: number; height: number; }
export interface CircleShape extends BaseShape { type: 'circle'; x: number; y: number; radius: number; }
export interface TextShape extends BaseShape { type: 'text'; x: number; y: number; text: string; fontSize: number; fontFamily: string; }
export interface MeasureShape extends BaseShape { type: 'measure'; points: number[]; realLength: number; unit: string; scaleRatio: string; }

export type Shape = PointShape | LineShape | PolylineShape | PolygonShape | RectShape | CircleShape | TextShape | MeasureShape;

export interface DrawingState {
  activeTool: ToolType;
  shapes: Shape[];
  selectedShapeIds: string[];
  currentStrokeColor: string;
  currentFillColor: string;
  currentStrokeWidth: number;
  currentFontSize: number;
  currentOpacity: number;
  scaleNumerator: number;
  scaleDenominator: number;
  scaleUnit: string;
  undoStack: Shape[][];
  redoStack: Shape[][];
  entities: Record<string, Shape>;
  idsByPage: Record<number, string[]>;
}

const initialState: DrawingState = {
  activeTool: 'select',
  shapes: [],
  selectedShapeIds: [],
  currentStrokeColor: '#000000',
  currentFillColor: 'transparent',
  currentStrokeWidth: 2,
  currentFontSize: 16,
  currentOpacity: 1,
  scaleNumerator: 1,
  scaleDenominator: 100,
  scaleUnit: 'mm',
  undoStack: [],
  redoStack: [],
  entities: {},
  idsByPage: {},
};

// ================= Slice =================
export const drawingSlice = createSlice({
  name: 'drawing',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<ToolType>) => {
      state.activeTool = action.payload;
      if (action.payload !== 'select') {
        state.selectedShapeIds = [];
      }
    },
    addShape: (state, action: PayloadAction<Omit<Shape, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const now = new Date().toISOString();
      const newShape = {
        ...action.payload,
        id: nanoid(),
        createdAt: now,
        updatedAt: now,
      } as Shape;
      state.shapes.push(newShape);
    },
    updateShape: (state, action: PayloadAction<{ id: string; changes: Partial<Shape> }>) => {
      const { id, changes } = action.payload;
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        Object.assign(shape, changes, { updatedAt: new Date().toISOString() });
      }
    },
    deleteShape: (state, action: PayloadAction<string>) => {
      state.shapes = state.shapes.filter(s => s.id !== action.payload);
      state.selectedShapeIds = state.selectedShapeIds.filter(id => id !== action.payload);
    },
    selectShape: (state, action: PayloadAction<{ id: string; multiSelect?: boolean }>) => {
      const { id, multiSelect } = action.payload;
      if (multiSelect) {
        if (!state.selectedShapeIds.includes(id)) {
          state.selectedShapeIds.push(id);
        } else {
          state.selectedShapeIds = state.selectedShapeIds.filter(sid => sid !== id);
        }
      } else {
        state.selectedShapeIds = [id];
      }
    },
    clearSelection: (state) => {
      state.selectedShapeIds = [];
    },
    deleteSelected: (state) => {
      state.shapes = state.shapes.filter(s => !state.selectedShapeIds.includes(s.id));
      state.selectedShapeIds = [];
    },
    setStrokeColor: (state, action: PayloadAction<string>) => { state.currentStrokeColor = action.payload; },
    setFillColor: (state, action: PayloadAction<string>) => { state.currentFillColor = action.payload; },
    setStrokeWidth: (state, action: PayloadAction<number>) => { state.currentStrokeWidth = action.payload; },
    setFontSize: (state, action: PayloadAction<number>) => { state.currentFontSize = action.payload; },
    setOpacity: (state, action: PayloadAction<number>) => { state.currentOpacity = action.payload; },
    setScaleRatio: (state, action: PayloadAction<{ num: number; den: number; unit: string }>) => {
      state.scaleNumerator = action.payload.num;
      state.scaleDenominator = action.payload.den;
      state.scaleUnit = action.payload.unit;
    },
    _pushUndo: (state, action: PayloadAction<Shape[]>) => {
      state.undoStack.push(action.payload);
      state.redoStack = []; 
      if (state.undoStack.length > 50) {
        state.undoStack.shift();
      }
    },
    undo: (state) => {
      if (state.undoStack.length > 0) {
        const previousShapes = state.undoStack.pop()!;
        state.redoStack.push(state.shapes);
        state.shapes = previousShapes;
      }
    },
    redo: (state) => {
      if (state.redoStack.length > 0) {
        const nextShapes = state.redoStack.pop()!;
        state.undoStack.push(state.shapes);
        state.shapes = nextShapes;
      }
    },
    importShapes: (state, action: PayloadAction<Shape[]>) => {
      state.shapes = [...state.shapes, ...action.payload];
    },
    // 【修复 2】：移除了 exportShapes，因为它不修改 state，不应作为 reducer
  },
});

// 【修复 2】：使用 createAction 定义不修改 state 的纯 Action
export const exportShapes = createAction('drawing/exportShapes');

// ================= Middleware =================
// 【修复 1】：为 action 显式指定 UnknownAction 类型
// ================= Middleware =================
export const undoableMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  // 1. 此时 action 的类型由 TS 推断为 unknown
  // 2. 基础校验：确保 action 是一个包含 type 属性的对象 (过滤掉 thunk 函数或非标准 dispatch)
  if (typeof action !== 'object' || action === null || !('type' in action)) {
    return next(action);
  }

  // 3. 经过类型守卫后，将其断言为 UnknownAction 以便后续操作
  const typedAction = action as UnknownAction;

  // 4. 拦截 undo/redo 本身，避免死循环
  if (typedAction.type === 'drawing/undo' || typedAction.type === 'drawing/redo') {
    return next(typedAction);
  }

  // 5. 拦截需要记录撤销栈的 actions
  // isAnyOf 内部已经处理了 unknown 类型的匹配逻辑
  if (isAnyOf(
    drawingSlice.actions.addShape,
    drawingSlice.actions.updateShape,
    drawingSlice.actions.deleteShape,
    drawingSlice.actions.deleteSelected,
    drawingSlice.actions.importShapes
  )(typedAction)) {
    const currentState = storeAPI.getState() as RootState;
    const currentShapes = currentState.drawing.shapes;
    
    // 深拷贝当前状态推入 undo 栈
    const shapesSnapshot = JSON.parse(JSON.stringify(currentShapes));
    storeAPI.dispatch(drawingSlice.actions._pushUndo(shapesSnapshot));
  }

  // 6. 继续执行下一个 middleware 或 reducer
  return next(typedAction);
};

// ================= Selectors =================
export const selectActiveTool = (state: RootState) => state.drawing.activeTool;
export const selectAllShapes = (state: RootState) => state.drawing.shapes;
export const selectSelectedShapeIds = (state: RootState) => state.drawing.selectedShapeIds;

export const selectShapesByPage = (state: RootState, pageId: number) => 
  state.drawing.shapes.filter(s => s.pageId === pageId);

export const selectShapesByLayer = (state: RootState, layerId: string) => 
  state.drawing.shapes.filter(s => s.layerId === layerId);

export const selectSelectedShapes = (state: RootState) => 
  state.drawing.shapes.filter(s => state.drawing.selectedShapeIds.includes(s.id));

export const selectCanUndo = (state: RootState) => state.drawing.undoStack.length > 0;
export const selectCanRedo = (state: RootState) => state.drawing.redoStack.length > 0;

// 导出 actions (注意：exportShapes 不在 drawingSlice.actions 中，需单独导出)
export const {
  setActiveTool, addShape, updateShape, deleteShape, 
  selectShape, clearSelection, deleteSelected,
  setStrokeColor, setFillColor, setStrokeWidth, setFontSize, setOpacity,
  setScaleRatio, undo, redo, importShapes
} = drawingSlice.actions;

export default drawingSlice;