import type {Middleware} from '@reduxjs/toolkit';
/**
 * History is implemented by drawing/undoableMiddleware.
 * This compatibility export is intentionally a no-op so legacy imports do not
 * create a second history system.
 */
export const createHistoryMiddleware=():Middleware=>()=>next=>action=>next(action);
