// src/app/store/slices/uiSlice.ts

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
  snapTypes: { endpoint:boolean; midpoint:boolean; center:boolean; intersection:boolean; nearest:boolean; grid:boolean };
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
  snapTypes: { endpoint:true, midpoint:true, center:true, intersection:true, nearest:true, grid:false },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleLeftPanel: (state) => { state.leftPanelOpen = !state.leftPanelOpen; },
    toggleRightPanel: (state) => { state.rightPanelOpen = !state.rightPanelOpen; },
    toggleToolbar: (state) => { state.toolbarCollapsed = !state.toolbarCollapsed; },
    toggleTreeView: (state) => { state.treeViewExpanded = !state.treeViewExpanded; },
    toggleAiPanel: (state) => { state.aiPanelOpen = !state.aiPanelOpen; },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    toggleGrid: (state) => { state.showGrid = !state.showGrid; },
    toggleSnapToGrid: (state) => { state.snapToGrid = !state.snapToGrid; },
    setGridSize: (state, action: PayloadAction<number>) => { state.gridSize = action.payload; },
    toggleSnap: (state) => { state.snapEnabled = !state.snapEnabled; },
    toggleSnapType: (state, action: PayloadAction<keyof UiState['snapTypes']>) => { state.snapTypes[action.payload] = !state.snapTypes[action.payload]; },
  },
});

export const {
  toggleLeftPanel, toggleRightPanel, toggleToolbar, toggleTreeView, toggleAiPanel,
  setTheme, toggleGrid, toggleSnapToGrid, setGridSize, toggleSnap, toggleSnapType
} = uiSlice.actions;

// Selectors
export const selectLeftPanelOpen = (state: RootState) => state.ui.leftPanelOpen;
export const selectRightPanelOpen = (state: RootState) => state.ui.rightPanelOpen;
export const selectToolbarCollapsed = (state: RootState) => state.ui.toolbarCollapsed;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectGridSettings = (state: RootState) => ({
  show: state.ui.showGrid,
  snap: state.ui.snapToGrid,
  size: state.ui.gridSize,
});

export default uiSlice;