import { configureStore } from '@reduxjs/toolkit';
import { pdfSlice } from './slices/pdfSlice';
import { drawingSlice } from './slices/drawingSlice';
import { layerSlice } from './slices/layerSlice';
import { uiSlice } from './slices/uiSlice';
import { aiSlice } from './slices/aiSlice';
import { undoableMiddleware } from './slices/drawingSlice';

export const store = configureStore({
  reducer: {
    pdf: pdfSlice.reducer,
    drawing: drawingSlice.reducer,
    layer: layerSlice.reducer,
    ui: uiSlice.reducer,
    ai: aiSlice.reducer,
  },
  // 注入自定义中间件，用于拦截绘图操作并自动记录撤销栈
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // 因为 pdf.document 包含 pdfjs 的复杂对象，不可序列化，需要忽略该路径
      serializableCheck: {
        ignoredPaths: ['pdf.document'],
        ignoredActions: ['pdf/setDocument'],
      },
    }).concat(undoableMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;