import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface UiState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  toolbarCollapsed: boolean;
  treeViewExpanded: boolean;
  aiPanelOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  snapEnabled: boolean;
  snapTypes: {
    endpoint: boolean;
    midpoint: boolean;
    center: boolean;
    intersection: boolean;
    nearest: boolean;
    grid: boolean;
  };
  // --- 新增：显示设置 ---
  showElementLabels: boolean; // 控制显示或关闭节点和柱梁墙等构件的编号
  showElementSections: boolean; // 控制显示或关闭构件的截面信息
  dimPdfBackground: boolean; // 控制显示或淡显背景PDF的颜色
}

const initialState: UiState = {
  leftPanelOpen: true,
  rightPanelOpen: true,
  toolbarCollapsed: false,
  treeViewExpanded: true,
  aiPanelOpen: false,
  theme: 'system',
  showGrid: true,
  snapToGrid: false,
  gridSize: 20,
  snapEnabled: true,
  snapTypes: {
    endpoint: true,
    midpoint: true,
    center: true,
    intersection: true,
    nearest: true,
    grid: false,
  },
  // --- 新增：显示设置初始值 ---
  showElementLabels: true,
  showElementSections: true,
  dimPdfBackground: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleLeftPanel: (state) => {
      state.leftPanelOpen = !state.leftPanelOpen;
    },
    toggleRightPanel: (state) => {
      state.rightPanelOpen = !state.rightPanelOpen;
    },
    toggleToolbar: (state) => {
      state.toolbarCollapsed = !state.toolbarCollapsed;
    },
    toggleTreeView: (state) => {
      state.treeViewExpanded = !state.treeViewExpanded;
    },
    toggleAiPanel: (state) => {
      state.aiPanelOpen = !state.aiPanelOpen;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },
    toggleSnapToGrid: (state) => {
      state.snapToGrid = !state.snapToGrid;
    },
    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload;
    },
    toggleSnap: (state) => {
      state.snapEnabled = !state.snapEnabled;
    },
    toggleSnapType: (state, action: PayloadAction<keyof UiState['snapTypes']>) => {
      state.snapTypes[action.payload] = !state.snapTypes[action.payload];
    },
    // --- 新增：显示设置 Actions ---
    toggleShowElementLabels: (state) => {
      state.showElementLabels = !state.showElementLabels;
    },
    toggleShowElementSections: (state) => {
      state.showElementSections = !state.showElementSections;
    },
    toggleDimPdfBackground: (state) => {
      state.dimPdfBackground = !state.dimPdfBackground;
    },
  },
});

export const {
  toggleLeftPanel,
  toggleRightPanel,
  toggleToolbar,
  toggleTreeView,
  toggleAiPanel,
  setTheme,
  toggleGrid,
  toggleSnapToGrid,
  setGridSize,
  toggleSnap,
  toggleSnapType,
  toggleShowElementLabels,
  toggleShowElementSections,
  toggleDimPdfBackground,
} = uiSlice.actions;

export default uiSlice;