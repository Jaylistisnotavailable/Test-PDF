import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// pdfjs-dist 的文档对象类型，这里用 any 避免复杂的类型导入问题
// type PdfDocumentProxy = any; 

export interface PdfState {
  currentPage: number;
  totalPages: number;
  scale: number;
  pageRotation: number;
  fileName: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: PdfState = {
  currentPage: 1,
  totalPages: 0,
  scale: 1.0,
  pageRotation: 0,
  fileName: null,
  loading: false,
  error: null,
};

export const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    // 【新增】用于接收从 usePdfDocument 传来的纯数据
    setTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload;
    },
    setFileName: (state, action: PayloadAction<string>) => {
      state.fileName = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      if (action.payload >= 1 && action.payload <= state.totalPages) {
        state.currentPage = action.payload;
      }
    },
    setScale: (state, action: PayloadAction<number>) => {
      state.scale = Math.max(0.25, Math.min(4.0, action.payload));
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    zoomIn: (state) => {
      state.scale = Math.min(4.0, state.scale * 1.2);
    },
    zoomOut: (state) => {
      state.scale = Math.max(0.25, state.scale / 1.2);
    },
    resetZoom: (state) => {
      state.scale = 1.0;
    },
    // fitToWidth 和 fitToPage 通常需要结合容器尺寸计算，这里设计为接收计算好的目标 scale
    fitToWidth: (state, action: PayloadAction<number>) => {
      state.scale = action.payload;
    },
    fitToPage: (state, action: PayloadAction<number>) => {
      state.scale = action.payload;
    },
    rotate: (state) => {
      state.pageRotation = (state.pageRotation + 90) % 360;
    },
    closeDocument: (state) => {
      // state.document = null;
      state.fileName = null;
      state.totalPages = 0;
      state.currentPage = 1;
      state.scale = 1.0;
      state.pageRotation = 0;
    }
  },
});

export const {
  setTotalPages, setFileName, setCurrentPage, setScale, zoomIn, zoomOut, 
  resetZoom, fitToWidth, fitToPage, rotate, closeDocument, 
  setLoading, setError
} = pdfSlice.actions;

// Selectors
// export const selectPdfDocument = (state: RootState) => state.pdf.document;
export const selectCurrentPage = (state: RootState) => state.pdf.currentPage;
export const selectTotalPages = (state: RootState) => state.pdf.totalPages;
export const selectPdfScale = (state: RootState) => state.pdf.scale;
export const selectPageRotation = (state: RootState) => state.pdf.pageRotation;
export const selectPdfLoading = (state: RootState) => state.pdf.loading;
export const selectPdfError = (state: RootState) => state.pdf.error;

export default pdfSlice;
