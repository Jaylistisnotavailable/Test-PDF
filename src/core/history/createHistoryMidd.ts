// src/core/history/createHistoryMiddleware.ts
import { Middleware, isAnyOf, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { drawingSlice } from '@/app/store/slices/drawingSlice';

export const createHistoryMiddleware = (): Middleware => {
  return (storeAPI) => (next) => (action) => {
    if (typeof action !== 'object' || action === null || !('type' in action)) return next(action);
    const typedAction = action as UnknownAction;

    if (typedAction.type === 'drawing/undo' || typedAction.type === 'drawing/redo') return next(typedAction);

    if (isAnyOf(
      drawingSlice.actions.addShape, drawingSlice.actions.updateShape,
      drawingSlice.actions.deleteShape, drawingSlice.actions.deleteSelected,
      drawingSlice.actions.importShapes
    )(typedAction)) {
      
      const currentState = storeAPI.getState() as RootState;
      storeAPI.dispatch(drawingSlice.actions._pushUndo(
        Object.values(currentState.drawing.entities)
      ));
    }
    return next(typedAction);
  };
};