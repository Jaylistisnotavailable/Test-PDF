import { useCallback } from 'react';
import type { Shape } from '@/app/store/slices/drawingSlice';
import type { Layer } from '@/app/store/slices/layerSlice';
import { distance, distanceToSegment, pointInPolygon } from '../geometry/geometryUtils';
import { hitTestStructuralElement } from '../geometry/hitTest';

// This hook returns a function that performs hit testing on the given shapes and layers.
// The returned function takes x and y coordinates and returns the first shape that is hit, or null if no shape is hit.
// The hit testing considers the visibility and lock status of layers, as well as a tolerance value for hit detection.
// The function iterates through the shapes in reverse order (from topmost to bottommost) and checks if the shape is within the valid layers. It then performs hit testing based on the shape type, using appropriate geometric calculations for each shape type (point, line, polyline, polygon, rectangle, circle, text). If a hit is detected, the shape is returned; otherwise, null is returned if no shapes are hit.
// The useCallback hook is used to memoize the hit testing function, ensuring that it only changes when the shapes, layers, or tolerance values change. This optimization helps prevent unnecessary re-renders and improves performance in React applications.
// 这个hook返回一个函数，该函数对给定的形状和图层执行命中测试。返回的函数接受x和y坐标，并返回第一个被命中的形状，如果没有形状被命中，则返回null。命中测试考虑了图层的可见性和锁定状态，以及用于命中检测的容差值。该函数以相反的顺序（从最上层到最下层）迭代形状，并检查形状是否在有效图层内。然后，它根据形状类型执行命中测试，使用适当的几何计算来处理每种形状类型（点、线、多线段、多边形、矩形、圆、文本）。如果检测到命中，则返回该形状；否则，如果没有形状被命中，则返回null。使用useCallback钩子来记忆命中测试函数，确保它仅在形状、图层或容差值发生变化时才会更改。这种优化有助于防止不必要的重新渲染，并提高React应用程序的性能。
export function useHitTest(shapes: Shape[], layers: Layer[], tolerance = 5) {
  return useCallback((x: number, y: number): Shape | null => {
    const valid = new Set(layers.filter(l => l.visible && !l.locked).map(l => l.id));
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (!valid.has(s.layerId)) continue;
      if ('geometry' in s && 'style' in s) {
        if (hitTestStructuralElement(s as any, { x, y }, tolerance)) return s;
        continue;
      }
      let hit = false;
      switch (s.type) {
        case 'point':
          hit = distance({ x, y }, { x: s.x, y: s.y }) <= s.radius + tolerance;
          break;
        case 'line':
          hit = distanceToSegment({ x, y }, { x: s.points[0], y: s.points[1] }, { x: s.points[2], y: s.points[3] }) <= tolerance;
          break;
        case 'polyline':
        case 'measure':
          for (let j = 0; j < s.points.length - 2; j += 2) {
            if (distanceToSegment({ x, y }, { x: s.points[j], y: s.points[j + 1] }, { x: s.points[j + 2], y: s.points[j + 3] }) <= tolerance) {
              hit = true;
              break;
            }
          }
          break;
        case 'polygon':
          hit = pointInPolygon({ x, y }, Array.from({ length: s.points.length / 2 }, (_, j) => ({ x: s.points[j * 2], y: s.points[j * 2 + 1] })));
          break;
        case 'rectangle':
          hit = x >= s.x - tolerance && x <= s.x + s.width + tolerance && y >= s.y - tolerance && y <= s.y + s.height + tolerance;
          break;
        case 'circle':
          hit = distance({ x, y }, { x: s.x, y: s.y }) <= s.radius + tolerance;
          break;
        case 'text': {
          const w = s.text.length * s.fontSize * .6, h = s.fontSize * 1.2;
          hit = x >= s.x && x <= s.x + w && y >= s.y && y <= s.y + h;
          break;
        }
      }
      if (hit) return s;
    }
    return null;
  }, [shapes, layers, tolerance]);
}