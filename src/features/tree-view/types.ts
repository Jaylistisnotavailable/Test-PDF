import type { Shape } from '@/app/store/slices/drawingSlice';

export type TreeNodeType = 'layer' | 'shape';

export interface TreeNodeData {
  id: string;
  type: TreeNodeType;
  label: string;
  code?: string; // 图形编号，如 P-001
  shapeType?: Shape['type'];
  info?: string; // 简要信息，如 "12.5m", "100×200"
  children?: TreeNodeData[];
  isExpanded?: boolean; // 仅图层节点使用
  count?: number; // 仅图层节点使用
  color?: string; // 仅图层节点使用
  shapeData?: Shape; // 仅图形节点使用
}

export type SortBy = 'createdAt' | 'type' | 'name';
