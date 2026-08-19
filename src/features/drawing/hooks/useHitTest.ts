import { useCallback } from 'react';
import type { Shape } from '@/app/store/slices/drawingSlice';
import type { Layer } from '@/app/store/slices/layerSlice';
import { distance, distanceToSegment, isPointInPolygon } from '../utils/geometry';

export function useHitTest(shapes: Shape[], layers: Layer[], tolerance: number = 5) {
  return useCallback((x: number, y: number): Shape | null => {

    // 1. 核心过滤：仅保留“可见”且“未锁定”的图层 ID
    const validLayerIds = layers
      .filter(l => l.visible && !l.locked)
      .map(l => l.id);

    // 2. 过滤出属于这些有效图层的图形
    const validShapes = shapes.filter(s => validLayerIds.includes(s.layerId));

    // 倒序遍历，后绘制的在上面，优先命中
    for (let i = validShapes.length - 1; i >= 0; i--) {
      const shape = validShapes[i];
      let hit = false;

      switch (shape.type) {
        case 'point':
          hit = distance(x, y, shape.x, shape.y) <= shape.radius + tolerance;
          break;
        case 'line':
          hit = distanceToSegment(x, y, shape.points[0], shape.points[1], shape.points[2], shape.points[3]) <= tolerance;
          break;
        case 'polyline':
        case 'measure':
          for (let j = 0; j < shape.points.length - 2; j += 2) {
            if (distanceToSegment(x, y, shape.points[j], shape.points[j+1], shape.points[j+2], shape.points[j+3]) <= tolerance) {
              hit = true; break;
            }
          }
          break;
        case 'polygon':
          hit = isPointInPolygon(x, y, shape.points);
          break;
        case 'rectangle':
          hit = x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height;
          break;
        case 'circle':
          hit = distance(x, y, shape.x, shape.y) <= shape.radius + tolerance;
          break;
        case 'text':
          // 简化：使用固定宽高估算
          const w = shape.text.length * shape.fontSize * 0.6;
          const h = shape.fontSize * 1.2;
          hit = x >= shape.x && x <= shape.x + w && y >= shape.y && y <= shape.y + h;
          break;
      }
      if (hit) return shape;
    }
    return null;
  }, [shapes, layers, tolerance]);
}
