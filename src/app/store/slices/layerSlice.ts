import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  color: string;
  order: number;
  shapeIds: string[];
}

export interface LayerState {
  layers: Layer[];
  activeLayerId: string;
  showDimensions: boolean;
  showLegend: boolean;
}

const initialState: LayerState = {
  layers: [
    {
      id: nanoid(),
      name: 'Default Layer',
      visible: true,
      locked: false,
      opacity: 1,
      color: '#3b82f6',
      order: 0,
      shapeIds: [],
    }
  ],
  activeLayerId: '', // 将在初始化时设置为第一个图层的 ID
  showDimensions: true,
  showLegend: true,
};

// 修正初始 activeLayerId
initialState.activeLayerId = initialState.layers[0].id;

export const layerSlice = createSlice({
  name: 'layer',
  initialState,
  reducers: {
    addLayer: (state, action: PayloadAction<{ name: string; color: string }>) => {
      const newLayer: Layer = {
        id: nanoid(),
        name: action.payload.name,
        visible: true,
        locked: false,
        opacity: 1,
        color: action.payload.color,
        order: state.layers.length,
        shapeIds: [],
      };
      state.layers.push(newLayer);
      state.activeLayerId = newLayer.id;
    },
    removeLayer: (state, action: PayloadAction<string>) => {
      if (state.layers.length <= 1) return; // 至少保留一个图层
      state.layers = state.layers.filter(l => l.id !== action.payload);
      if (state.activeLayerId === action.payload) {
        state.activeLayerId = state.layers[0].id;
      }
      // 重新排序
      state.layers.forEach((layer, index) => {
        layer.order = index;
      });
    },
    updateLayer: (state, action: PayloadAction<{ id: string; changes: Partial<Layer> }>) => {
      const layer = state.layers.find(l => l.id === action.payload.id);
      if (layer) {
        Object.assign(layer, action.payload.changes);
      }
    },
    reorderLayer: (state, action: PayloadAction<{ id: string; newOrder: number }>) => {
      const { id, newOrder } = action.payload;
      const layerIndex = state.layers.findIndex(l => l.id === id);
      if (layerIndex === -1) return;

      const [movedLayer] = state.layers.splice(layerIndex, 1);
      state.layers.splice(newOrder, 0, movedLayer);
      
      // 更新所有图层的 order 属性
      state.layers.forEach((layer, index) => {
        layer.order = index;
      });
    },
    setActiveLayer: (state, action: PayloadAction<string>) => {
      state.activeLayerId = action.payload;
    },
    toggleLayerVisibility: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find(l => l.id === action.payload);
      if (layer) layer.visible = !layer.visible;
    },
    toggleLayerLock: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find(l => l.id === action.payload);
      if (layer) layer.locked = !layer.locked;
    },
    toggleDimensions: (state) => {
      state.showDimensions = !state.showDimensions;
    },
    toggleLegend: (state) => {
      state.showLegend = !state.showLegend;
    },
  },
});

export const {
  addLayer, removeLayer, updateLayer, reorderLayer,
  setActiveLayer, toggleLayerVisibility, toggleLayerLock,
  toggleDimensions, toggleLegend
} = layerSlice.actions;

// Selectors
export const selectAllLayers = (state: RootState) => state.layer.layers;
export const selectActiveLayerId = (state: RootState) => state.layer.activeLayerId;
export const selectActiveLayer = (state: RootState) => 
  state.layer.layers.find(l => l.id === state.layer.activeLayerId);
export const selectShowDimensions = (state: RootState) => state.layer.showDimensions;
export const selectShowLegend = (state: RootState) => state.layer.showLegend;

export default layerSlice;