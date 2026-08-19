import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { Shape } from '@/app/store/slices/drawingSlice';
import type { TreeNodeData, SortBy } from './types';
import type { Layer } from '@/types';

// 编号前缀映射
const CODE_PREFIX: Record<Shape['type'], string> = {
  point: 'P', line: 'L', polyline: 'PL', polygon: 'PG',
  rectangle: 'R', circle: 'C', text: 'T', measure: 'M'
};

// 获取图形简要信息
const getShapeInfo = (shape: Shape): string => {
  switch (shape.type) {
    case 'point': return `点`;
    case 'line': return `直线`;
    case 'polyline': return `折线 (${shape.points.length / 2}点)`;
    case 'polygon': return `多边形 (${shape.points.length / 2}点)`;
    case 'rectangle': return `${shape.width.toFixed(0)}×${shape.height.toFixed(0)}`;
    case 'circle': return `r=${shape.radius.toFixed(0)}`;
    case 'text': return `"${shape.text.substring(0, 10)}${shape.text.length > 10 ? '...' : ''}"`;
    case 'measure': return `${shape.realLength} ${shape.unit}`;
    default: return '';
  }
};

// 1. 计算全局唯一编号 (删除不回收)
// 策略：将所有 shapes 按 createdAt 排序，依次分配编号。
const computeShapeCodes = (allShapes: Shape[]): Map<string, string> => {
  const codeMap = new Map<string, string>();
  const counters: Record<string, number> = {};
  
  // 按创建时间升序排序，确保先创建的编号小
  const sorted = [...allShapes].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sorted.forEach(shape => {
    const prefix = CODE_PREFIX[shape.type];
    if (!counters[prefix]) counters[prefix] = 0;
    counters[prefix]++;
    codeMap.set(shape.id, `${prefix}-${String(counters[prefix]).padStart(3, '0')}`);
  });

  return codeMap;
};

// 2. 构建选择器
const selectAllShapes = (state: RootState) => state.drawing.shapes;
const selectLayers = (state: RootState) => state.layer.layers;
const selectCurrentPage = (state: RootState) => state.pdf.currentPage;

interface TreeParams {
  searchQuery: string;
  sortBy: SortBy;
}

const makeSelectTreeData = () => 
  createSelector(
    [selectAllShapes, selectLayers, selectCurrentPage, (_, params: TreeParams) => params],
    (allShapes, layers, currentPage, params) => {
      const { searchQuery, sortBy } = params;
      
      // 计算全局编号
      const codeMap = computeShapeCodes(allShapes);

      // 过滤当前页的 shapes
      let pageShapes = allShapes.filter(s => s.pageIndex === currentPage);

      // 搜索过滤
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        pageShapes = pageShapes.filter(s => {
          const code = codeMap.get(s.id) || '';
          const info = getShapeInfo(s);
          const label = s.label || '';
          return (
            code.toLowerCase().includes(q) ||
            s.type.toLowerCase().includes(q) ||
            info.toLowerCase().includes(q) ||
            label.toLowerCase().includes(q)
          );
        });
      }

      // 排序函数
      const sortShapes = (shapes: Shape[]) => {
        return [...shapes].sort((a, b) => {
          if (sortBy === 'createdAt') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // 新的在上
          }
          if (sortBy === 'type') {
            return a.type.localeCompare(b.type);
          }
          if (sortBy === 'name') {
            return (a.label || '').localeCompare(b.label || '');
          }
          return 0;
        });
      };

      // 按图层分组构建树
      const tree: TreeNodeData[] = [];
      
      layers.forEach(layer => {
        const layerShapes = pageShapes.filter(s => s.layerId === layer.id);
        
        // 如果没有图形且开启了搜索，则隐藏空图层
        if (layerShapes.length === 0 && searchQuery) return;

        const sortedLayerShapes = sortShapes(layerShapes);

        const shapeNodes: TreeNodeData[] = sortedLayerShapes.map(shape => ({
          id: shape.id,
          type: 'shape',
          label: shape.label || getShapeInfo(shape),
          code: codeMap.get(shape.id),
          shapeType: shape.type,
          info: getShapeInfo(shape),
          shapeData: shape,
        }));

        tree.push({
          id: layer.id,
          type: 'layer',
          label: layer.name,
          color: layer.color,
          count: layerShapes.length,
          isExpanded: true, // 默认展开
          children: shapeNodes,
        });
      });

      return tree;
    }
  );

export function useTreeData(searchQuery: string, sortBy: SortBy) {
  const selector = useMemo(makeSelectTreeData, []);
  return useSelector((state: RootState) => selector(state, { searchQuery, sortBy }));
}
